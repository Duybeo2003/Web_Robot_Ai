"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { AuthorizationError, requireRole, requireUser } from "@/lib/authz";
import { cancelOrderAndRestoreInventory } from "@/lib/orders/cancel-order";
import { prisma } from "@/lib/prisma";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];
const PAYMENT_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "REFUNDED",
];
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "RETURNED"],
  COMPLETED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  requestedPaymentStatus: PaymentStatus,
) {
  try {
    const operator = await requireRole("ADMIN", "STORE_MANAGER");
    if (
      !orderId ||
      !ORDER_STATUSES.includes(status) ||
      !PAYMENT_STATUSES.includes(requestedPaymentStatus)
    ) {
      return { success: false, error: "Dữ liệu trạng thái không hợp lệ." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          paymentTransactions: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      if (!order) throw new Error("Không tìm thấy đơn hàng.");

      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        const cancelled = await cancelOrderAndRestoreInventory(
          tx,
          order.id,
          ["PENDING", "PROCESSING"],
        );
        if (!cancelled) {
          throw new Error("Đơn đã thanh toán cần được hoàn tiền trước khi hủy.");
        }
        return { status: "CANCELLED" as const, paymentStatus: order.paymentStatus };
      }

      if (
        status !== order.status &&
        !VALID_TRANSITIONS[order.status].includes(status)
      ) {
        throw new Error(
          `Không thể chuyển trạng thái từ ${order.status} sang ${status}.`,
        );
      }

      let paymentStatus = order.paymentStatus;
      let amountPaid = Number(order.amountPaid);
      let amountDue = Number(order.amountDue);
      if (requestedPaymentStatus !== order.paymentStatus) {
        if (requestedPaymentStatus !== "PAID") {
          throw new Error(
            "Chỉ có thể xác nhận khoản thanh toán đang chờ. Hoàn tiền cần thực hiện qua quy trình hoàn tiền riêng.",
          );
        }

        const pendingPayment = order.paymentTransactions[0];
        if (!pendingPayment) throw new Error("Không có khoản thanh toán đang chờ xác nhận.");
        if (order.paymentMethod === "VNPAY" && operator.role !== "ADMIN") {
          throw new Error("Chỉ quản trị viên được đối soát thủ công giao dịch VNPay.");
        }

        const claimed = await tx.paymentTransaction.updateMany({
          where: { id: pendingPayment.id, status: "PENDING" },
          data: { status: "SUCCEEDED", processedAt: new Date() },
        });
        if (claimed.count === 0) throw new Error("Giao dịch đã được xử lý trước đó.");

        amountPaid += Number(pendingPayment.amount);
        amountDue = Math.max(0, Number(order.totalAmount) - amountPaid);
        paymentStatus = amountDue === 0 ? "PAID" : "PARTIALLY_PAID";
      }

      if (status === "COMPLETED" && amountDue > 0) {
        throw new Error("Không thể hoàn tất đơn hàng khi vẫn còn số tiền chưa thanh toán.");
      }

      if (status === "COMPLETED" && order.status !== "COMPLETED" && order.pointsEarned > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { points: { increment: order.pointsEarned } },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          paymentStatus,
          amountPaid,
          amountDue,
          ...(paymentStatus !== "UNPAID" ? { inventoryReservedUntil: null } : {}),
        },
      });
      return { status, paymentStatus };
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true, ...result };
  } catch (error) {
    console.error("[UPDATE_ORDER_ERROR]", error);
    const message =
      error instanceof AuthorizationError
        ? "Bạn không có quyền thực hiện thao tác này."
        : error instanceof Error
          ? error.message
          : "Không thể cập nhật đơn hàng.";
    return { success: false, error: message };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const user = await requireUser();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true },
    });
    if (!order || order.userId !== user.id) {
      return { success: false, error: "Không tìm thấy đơn hàng." };
    }
    if (order.status !== "PENDING") {
      return { success: false, error: "Đơn hàng đã được xử lý nên không thể tự hủy." };
    }

    const cancelled = await prisma.$transaction((tx) =>
      cancelOrderAndRestoreInventory(tx, orderId),
    );
    if (!cancelled) {
      return { success: false, error: "Đơn hàng đã thay đổi trạng thái. Vui lòng tải lại trang." };
    }

    revalidatePath("/profile/orders");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("[CANCEL_ORDER_ERROR]", error);
    return {
      success: false,
      error:
        error instanceof AuthorizationError
          ? "Bạn cần đăng nhập để hủy đơn hàng."
          : "Không thể hủy đơn hàng.",
    };
  }
}
