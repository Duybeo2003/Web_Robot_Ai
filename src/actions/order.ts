"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { AuthorizationError, requireRole, requireUser } from "@/lib/authz";
import { cancelOrderAndRestoreInventory } from "@/lib/orders/cancel-order";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { lockOrderRow } from "@/lib/orders/lock-order";
import { z } from "zod";

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
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  RETURNED: [],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  requestedPaymentStatus: PaymentStatus,
  rawPaymentReference?: string,
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
      await lockOrderRow(tx, orderId);
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
        return {
          status: "CANCELLED" as const,
          paymentStatus: order.paymentStatus,
          previousStatus: order.status,
          previousPaymentStatus: order.paymentStatus,
        };
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
        const paymentReference = rawPaymentReference?.trim().slice(0, 191) || "";
        if (pendingPayment.provider !== "COD" && paymentReference.length < 6) {
          throw new Error("Cần nhập mã đối soát của khoản thanh toán.");
        }
        if (pendingPayment.provider === "VNPAY" && operator.role !== "ADMIN") {
          throw new Error("Chỉ quản trị viên được đối soát thủ công giao dịch VNPay.");
        }

        const claimed = await tx.paymentTransaction.updateMany({
          where: { id: pendingPayment.id, status: "PENDING" },
          data: {
            status: "SUCCEEDED",
            processedAt: new Date(),
            providerTransactionId:
              paymentReference || `manual-cod:${pendingPayment.id}`,
            rawResponse: {
              kind: "manual_payment_confirmation",
              confirmedBy: operator.id,
              reference: paymentReference || null,
            } satisfies Prisma.InputJsonObject,
          },
        });
        if (claimed.count === 0) throw new Error("Giao dịch đã được xử lý trước đó.");

        amountPaid += Number(pendingPayment.amount);
        amountDue = Math.max(0, Number(order.totalAmount) - amountPaid);
        paymentStatus = amountDue === 0 ? "PAID" : "PARTIALLY_PAID";

        if (amountDue > 0) {
          await tx.paymentTransaction.upsert({
            where: { idempotencyKey: `balance:${order.id}` },
            update: {},
            create: {
              orderId: order.id,
              provider: "COD",
              status: "PENDING",
              amount: amountDue,
              idempotencyKey: `balance:${order.id}`,
            },
          });
        }
      }

      if (status === "COMPLETED" && amountDue > 0) {
        throw new Error("Không thể hoàn tất đơn hàng khi vẫn còn số tiền chưa thanh toán.");
      }
      if (
        order.paymentMethod !== "COD" &&
        paymentStatus === "UNPAID" &&
        !["PENDING", "CANCELLED"].includes(status)
      ) {
        throw new Error("Đơn thanh toán trước phải được xác nhận tiền trước khi xử lý.");
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
          ...(status === "COMPLETED" && order.status !== "COMPLETED"
            ? { completedAt: new Date() }
            : {}),
          ...(paymentStatus !== "UNPAID" ? { inventoryReservedUntil: null } : {}),
        },
      });
      return {
        status,
        paymentStatus,
        previousStatus: order.status,
        previousPaymentStatus: order.paymentStatus,
      };
    });

    await recordAudit({
      actorId: operator.id,
      action: "order.status_update",
      model: "Order",
      recordId: orderId,
      before: {
        status: result.previousStatus,
        paymentStatus: result.previousPaymentStatus,
      },
      after: {
        status: result.status,
        paymentStatus: result.paymentStatus,
        paymentReference: rawPaymentReference?.trim() || null,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true, status: result.status, paymentStatus: result.paymentStatus };
  } catch (error) {
    console.error("[UPDATE_ORDER_ERROR]", error);
    const message =
      error instanceof AuthorizationError
        ? "Bạn không có quyền thực hiện thao tác này."
        : error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Mã đối soát đã được dùng cho giao dịch khác."
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

    await recordAudit({
      actorId: user.id,
      action: "order.customer_cancel",
      model: "Order",
      recordId: orderId,
      before: { status: order.status },
      after: { status: "CANCELLED" },
    });

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

export async function confirmOrderRefund(rawOrderId: string, rawReference: string) {
  try {
    const operator = await requireRole("ADMIN");
    const input = z.object({
      orderId: z.string().min(1).max(191),
      reference: z.string().trim().min(6).max(191),
    }).parse({ orderId: rawOrderId, reference: rawReference });

    const refundResult = await prisma.$transaction(async (tx) => {
      await lockOrderRow(tx, input.orderId);
      const order = await tx.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new Error("Không tìm thấy đơn hàng.");
      if (!["RETURNED", "CANCELLED"].includes(order.status)) {
        throw new Error("Chỉ xác nhận hoàn tiền cho đơn đã trả hàng hoặc đã hủy.");
      }
      if (order.paymentStatus === "REFUNDED") {
        const existingRefund = await tx.paymentTransaction.findUnique({
          where: { idempotencyKey: `refund:${order.id}` },
          select: { amount: true },
        });
        return { amount: Number(existingRefund?.amount || 0), changed: false };
      }
      if (
        !["PAID", "PARTIALLY_PAID"].includes(order.paymentStatus) ||
        Number(order.amountPaid) <= 0
      ) {
        throw new Error("Đơn hàng không có khoản đã thanh toán để hoàn.");
      }

      const amount = Number(order.amountPaid);
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: order.paymentMethod,
          status: "REFUNDED",
          amount,
          idempotencyKey: `refund:${order.id}`,
          providerTransactionId: input.reference,
          rawResponse: {
            kind: "manual_refund_confirmation",
            reference: input.reference,
            confirmedBy: operator.id,
          },
          processedAt: new Date(),
        },
      });
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: ["RETURNED", "CANCELLED"] },
          paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
        },
        data: { paymentStatus: "REFUNDED", amountPaid: 0, amountDue: 0 },
      });
      if (claimed.count === 0) throw new Error("Trạng thái đơn hàng vừa thay đổi. Vui lòng tải lại.");
      if (order.status === "RETURNED" && order.pointsUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { points: { increment: order.pointsUsed } },
        });
      }
      return { amount, changed: true };
    });

    if (refundResult.changed) {
      await recordAudit({
        actorId: operator.id,
        action: "order.refund_confirmed",
        model: "Order",
        recordId: input.orderId,
        after: {
          status: "REFUNDED",
          amount: refundResult.amount,
          reference: input.reference,
        },
      });
    }
    revalidatePath("/admin/orders");
    revalidatePath("/admin/reports");
    revalidatePath("/profile/orders");
    return { success: true as const };
  } catch (error) {
    console.error("[CONFIRM_REFUND_ERROR]", error);
    return {
      success: false as const,
      error:
        error instanceof AuthorizationError
          ? "Bạn không có quyền xác nhận hoàn tiền."
          : error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code === "P2002"
              ? "Mã đối soát đã được dùng cho giao dịch khác."
              : "Không thể ghi nhận giao dịch hoàn tiền."
            : error instanceof Error
              ? error.message
              : "Không thể xác nhận hoàn tiền.",
    };
  }
}
