"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentStatus: PaymentStatus,
) {
  try {
    const session = await auth();
    if (
      !session?.user?.role ||
      !["ADMIN", "STORE_MANAGER"].includes(session.user.role)
    ) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      
      // If changing to CANCELLED from a non-CANCELLED state, return inventory
      if (order && order.status !== "CANCELLED" && status === "CANCELLED") {
        for (const item of order.items) {
          // Fix #2: Restore inventory to the correct target (variant or product)
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

        // Refund used points if cancelled
        if (order.pointsUsed > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { points: { increment: order.pointsUsed } }
          });
        }
        
        // Revoke earned points if it was already completed and now cancelled
        if (order.status === "COMPLETED" && order.pointsEarned > 0) {
           await tx.user.update({
            where: { id: order.userId },
            data: { points: { decrement: order.pointsEarned } }
          });
        }
      }

      // Reward points if order is successfully completed
      if (order && order.status !== "COMPLETED" && status === "COMPLETED") {
        if (order.pointsEarned > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { points: { increment: order.pointsEarned } }
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status, paymentStatus },
      });
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true };
  } catch (error) {
    console.error("Update order error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return { success: false, error: "Order not found" };

    // Only allow cancelling if it belongs to the user and is PENDING
    if (order.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (order.status !== "PENDING") {
      return {
        success: false,
        error: "Cannot cancel order that is already being processed",
      };
    }

    await prisma.$transaction(async (tx) => {
      const orderToCancel = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (orderToCancel) {
        for (const item of orderToCancel.items) {
          // Fix #2: Restore inventory to the correct target (variant or product)
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
        if (orderToCancel.pointsUsed > 0) {
          await tx.user.update({
            where: { id: orderToCancel.userId },
            data: { points: { increment: orderToCancel.pointsUsed } }
          });
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    });

    revalidatePath("/profile/orders");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Cancel order error:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}
