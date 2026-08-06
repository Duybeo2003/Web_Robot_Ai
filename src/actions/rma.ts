"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createReturnRequest(data: {
  orderId: string;
  reason: string;
  imageUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!data.reason || data.reason.length < 10) {
    return { error: "Lý do đổi trả phải có ít nhất 10 ký tự." };
  }

  try {
    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order || order.userId !== session.user.id) {
      return { error: "Không tìm thấy đơn hàng." };
    }

    // Must be COMPLETED to request return (or SHIPPED, depending on logic, let's allow COMPLETED & SHIPPED)
    if (order.status !== "COMPLETED" && order.status !== "SHIPPED") {
      return { error: "Chỉ có thể yêu cầu đổi trả cho đơn hàng đã giao." };
    }

    // Check if already requested
    const existing = await prisma.returnRequest.findFirst({
      where: { orderId: data.orderId },
    });

    if (existing) {
      return { error: "Bạn đã gửi yêu cầu cho đơn hàng này rồi." };
    }

    await prisma.returnRequest.create({
      data: {
        userId: session.user.id,
        orderId: data.orderId,
        reason: data.reason,
        imageUrl: data.imageUrl,
        status: "PENDING",
      },
    });

    revalidatePath("/profile/orders");
    return { success: true };
  } catch (e: unknown) {
    console.error("[CREATE_RMA]", e);
    return { error: "Lỗi tạo yêu cầu đổi trả." };
  }
}

export async function updateReturnRequestStatus(
  id: string,
  status: "APPROVED" | "REJECTED" | "COMPLETED",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const returnReq = await tx.returnRequest.update({
        where: { id },
        data: { status },
        include: { order: { include: { items: true } } },
      });

      // If return is COMPLETED, refund inventory and points (similar to cancel)
      if (status === "COMPLETED" && returnReq.order) {
        const order = returnReq.order;
        
        // Prevent double return if order was already cancelled/returned
        if (order.status !== "CANCELLED" && order.status !== "RETURNED") {
          for (const item of order.items) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { inventoryCount: { increment: item.quantity } },
              });
            } else {
              const dbProduct = await tx.product.findUnique({ where: { id: item.productId } });
              if (dbProduct) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    inventoryCount: { increment: item.quantity },
                    ...(dbProduct.flashSaleActive && dbProduct.flashSaleStock !== null
                      ? { flashSaleStock: { increment: item.quantity } }
                      : {})
                  }
                });
              }
            }
          }
          
          // Refund used points
          if (order.pointsUsed > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: { points: { increment: order.pointsUsed } }
            });
          }

          // Revoke earned points
          if (order.pointsEarned > 0) {
             await tx.user.update({
              where: { id: order.userId },
              data: { points: { decrement: order.pointsEarned } }
            });
          }

          // Update order status
          await tx.order.update({
            where: { id: order.id },
            data: { status: "RETURNED" },
          });
        }
      }
    });

    revalidatePath("/admin/returns");
    revalidatePath("/profile/orders");
    return { success: true };
  } catch (e: unknown) {
    console.error("[RMA_UPDATE]", e);
    return { error: "Lỗi cập nhật trạng thái." };
  }
}
