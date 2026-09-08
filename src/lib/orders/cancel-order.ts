import "server-only";

import type { OrderStatus, Prisma } from "@prisma/client";
import { lockOrderRow } from "@/lib/orders/lock-order";

export async function cancelOrderAndRestoreInventory(
  tx: Prisma.TransactionClient,
  orderId: string,
  allowedStatuses: OrderStatus[] = ["PENDING"],
) {
  await lockOrderRow(tx, orderId);
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || !allowedStatuses.includes(order.status)) return false;

  const claimed = await tx.order.updateMany({
    where: {
      id: orderId,
      status: { in: allowedStatuses },
      paymentStatus: "UNPAID",
    },
    data: { status: "CANCELLED", inventoryReservedUntil: null },
  });
  if (claimed.count === 0) return false;

  await tx.paymentTransaction.updateMany({
    where: { orderId, status: "PENDING" },
    data: { status: "FAILED", processedAt: new Date() },
  });

  for (const item of order.items) {
    if (item.variantId) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { inventoryCount: { increment: item.quantity } },
      });
    }

    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { flashSaleStock: true },
    });
    if (product) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          ...(!item.variantId
            ? { inventoryCount: { increment: item.quantity } }
            : {}),
          ...(product.flashSaleStock !== null
            ? { flashSaleStock: { increment: item.quantity } }
            : {}),
        },
      });
    }
  }

  if (order.pointsUsed > 0) {
    await tx.user.update({
      where: { id: order.userId },
      data: { points: { increment: order.pointsUsed } },
    });
  }
  if (order.couponCode) {
    await tx.coupon.updateMany({
      where: { code: order.couponCode, usageCount: { gt: 0 } },
      data: { usageCount: { decrement: 1 } },
    });
  }
  await tx.commission.updateMany({
    where: { orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  return true;
}
