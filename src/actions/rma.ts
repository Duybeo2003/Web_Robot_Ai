"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { RETURN_WINDOW_DAYS } from "@/lib/commerce-policy";
import { Prisma } from "@prisma/client";
import { isAllowedImageUrl } from "@/lib/media-url";

const returnRequestSchema = z.object({
  orderId: z.string().min(1).max(191),
  reason: z.string().trim().min(10).max(2_000),
  imageUrl: z
    .string()
    .trim()
    .max(2_000)
    .refine(isAllowedImageUrl, "Ảnh minh chứng không hợp lệ.")
    .optional(),
});
const returnStatusSchema = z.enum(["APPROVED", "REJECTED", "COMPLETED"]);

export async function createReturnRequest(input: unknown) {
  try {
    const user = await requireUser();
    const data = returnRequestSchema.parse(input);
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, userId: user.id },
      select: { id: true, status: true, completedAt: true, updatedAt: true },
    });
    if (!order) return { error: "Không tìm thấy đơn hàng." };
    if (order.status !== "COMPLETED") {
      return { error: "Chỉ có thể yêu cầu đổi trả cho đơn hàng đã giao." };
    }
    const completedAt = order.completedAt || order.updatedAt;
    const returnDeadline = new Date(
      completedAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (returnDeadline.getTime() < Date.now()) {
      return {
        error: `Đơn hàng đã quá thời hạn đổi trả ${RETURN_WINDOW_DAYS} ngày. Vui lòng liên hệ hỗ trợ nếu sản phẩm còn bảo hành.`,
      };
    }

    const existing = await prisma.returnRequest.findFirst({
      where: { orderId: order.id },
    });
    if (existing) return { error: "Đơn hàng này đã có yêu cầu đổi trả." };

    await prisma.returnRequest.create({
      data: { ...data, userId: user.id, status: "PENDING" },
    });
    revalidatePath("/profile/orders");
    return { success: true };
  } catch (error) {
    console.error("[CREATE_RMA_ERROR]", error);
    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Đơn hàng này đã có yêu cầu đổi trả."
          : "Không thể tạo yêu cầu đổi trả.",
    };
  }
}

export async function updateReturnRequestStatus(
  id: string,
  input: unknown,
  restockReturnedItems = false,
) {
  try {
    const operator = await requireRole("ADMIN");
    const requestId = z.string().min(1).max(191).parse(id);
    const status = returnStatusSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.findUnique({
        where: { id: requestId },
        include: { order: { include: { items: true } } },
      });
      if (!returnRequest) throw new Error("Không tìm thấy yêu cầu đổi trả.");
      const transitions = {
        PENDING: ["APPROVED", "REJECTED"],
        APPROVED: ["COMPLETED"],
        REJECTED: [],
        COMPLETED: [],
      } as const;
      if (returnRequest.status === status) {
        return { previousStatus: returnRequest.status, orderId: returnRequest.orderId };
      }
      if (!(transitions[returnRequest.status] as readonly string[]).includes(status)) {
        throw new Error(`Không thể chuyển từ ${returnRequest.status} sang ${status}.`);
      }

      const updated = await tx.returnRequest.updateMany({
        where: { id: requestId, status: returnRequest.status },
        data: { status },
      });
      if (updated.count === 0) throw new Error("Yêu cầu vừa được xử lý ở phiên khác.");
      if (status !== "COMPLETED") {
        return { previousStatus: returnRequest.status, orderId: returnRequest.orderId };
      }

      const claimed = await tx.order.updateMany({
        where: {
          id: returnRequest.order.id,
          status: { notIn: ["CANCELLED", "RETURNED"] },
        },
        data: {
          status: "RETURNED",
          ...(returnRequest.order.pointsUsed > 0 &&
          !returnRequest.order.pointsRestoredAt
            ? { pointsRestoredAt: new Date() }
            : {}),
          ...(Number(returnRequest.order.amountPaid) === 0 &&
          returnRequest.order.paymentStatus === "PAID" &&
          returnRequest.order.pointsUsed > 0
            ? { paymentStatus: "REFUNDED" }
            : {}),
        },
      });
      if (claimed.count === 0) {
        return { previousStatus: returnRequest.status, orderId: returnRequest.orderId };
      }

      if (restockReturnedItems) {
        for (const item of returnRequest.order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { inventoryCount: { increment: item.quantity } },
            });
          } else {
            await tx.product.updateMany({
              where: { id: item.productId },
              data: { inventoryCount: { increment: item.quantity } },
            });
          }
        }
      }

      const loyaltyDelta =
        (returnRequest.order.pointsUsed > 0 &&
        !returnRequest.order.pointsRestoredAt
          ? returnRequest.order.pointsUsed
          : 0) - returnRequest.order.pointsEarned;
      if (loyaltyDelta !== 0) {
        await tx.user.update({
          where: { id: returnRequest.order.userId },
          data: { points: { increment: loyaltyDelta } },
        });
      }
      await tx.commission.updateMany({
        where: { orderId: returnRequest.order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      await tx.commission.updateMany({
        where: { orderId: returnRequest.order.id, status: "PAID" },
        data: { status: "REVERSED", reversedAt: new Date() },
      });
      return { previousStatus: returnRequest.status, orderId: returnRequest.orderId };
    });

    await recordAudit({
      actorId: operator.id,
      action: "return_request.status_update",
      model: "ReturnRequest",
      recordId: requestId,
      before: { status: result.previousStatus },
      after: { status, restocked: status === "COMPLETED" && restockReturnedItems, orderId: result.orderId },
    });

    revalidatePath("/admin/returns");
    revalidatePath("/profile/orders");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_RMA_ERROR]", error);
    return {
      error: error instanceof Error ? error.message : "Không thể cập nhật yêu cầu đổi trả.",
    };
  }
}
