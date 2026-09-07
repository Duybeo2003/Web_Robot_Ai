"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const returnRequestSchema = z.object({
  orderId: z.string().min(1).max(191),
  reason: z.string().trim().min(10).max(2_000),
  imageUrl: z.string().trim().max(2_000).optional(),
});
const returnStatusSchema = z.enum(["APPROVED", "REJECTED", "COMPLETED"]);

export async function createReturnRequest(input: unknown) {
  try {
    const user = await requireUser();
    const data = returnRequestSchema.parse(input);
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, userId: user.id },
      select: { id: true, status: true },
    });
    if (!order) return { error: "Không tìm thấy đơn hàng." };
    if (!(["COMPLETED", "SHIPPED"] as string[]).includes(order.status)) {
      return { error: "Chỉ có thể yêu cầu đổi trả cho đơn hàng đã giao." };
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
    return { error: "Không thể tạo yêu cầu đổi trả." };
  }
}

export async function updateReturnRequestStatus(id: string, input: unknown) {
  try {
    await requireRole("ADMIN");
    const requestId = z.string().min(1).max(191).parse(id);
    const status = returnStatusSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.findUnique({
        where: { id: requestId },
        include: { order: { include: { items: true } } },
      });
      if (!returnRequest) throw new Error("Không tìm thấy yêu cầu đổi trả.");
      if (returnRequest.status === "COMPLETED") {
        if (status === "COMPLETED") return;
        throw new Error("Yêu cầu đã hoàn tất nên không thể thay đổi.");
      }

      await tx.returnRequest.update({ where: { id: requestId }, data: { status } });
      if (status !== "COMPLETED") return;

      const claimed = await tx.order.updateMany({
        where: {
          id: returnRequest.order.id,
          status: { notIn: ["CANCELLED", "RETURNED"] },
        },
        data: { status: "RETURNED" },
      });
      if (claimed.count === 0) return;

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

      if (returnRequest.order.pointsEarned > 0) {
        const owner = await tx.user.findUnique({
          where: { id: returnRequest.order.userId },
          select: { points: true },
        });
        if (owner) {
          await tx.user.update({
            where: { id: returnRequest.order.userId },
            data: {
              points: Math.max(0, owner.points - returnRequest.order.pointsEarned),
            },
          });
        }
      }
      await tx.commission.updateMany({
        where: { orderId: returnRequest.order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
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
