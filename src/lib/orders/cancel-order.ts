import "server-only";

import type { OrderStatus, Prisma } from "@prisma/client";
import { lockOrderRow } from "@/lib/orders/lock-order";
import { inventoryMovementKey } from "@/lib/inventory-ledger";

export async function cancelOrderAndRestoreInventory(
  tx: Prisma.TransactionClient,
  orderId: string,
  allowedStatuses: OrderStatus[] = ["PENDING"],
  options: { allowPaid?: boolean; actorId?: string } = {},
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
      paymentStatus: options.allowPaid
        ? { in: ["UNPAID", "PARTIALLY_PAID", "PAID"] }
        : "UNPAID",
    },
    data: {
      status: "CANCELLED",
      inventoryReservedUntil: null,
      ...(order.pointsUsed > 0 && !order.pointsRestoredAt
        ? { pointsRestoredAt: new Date() }
        : {}),
    },
  });
  if (claimed.count === 0) return false;

  await tx.paymentTransaction.updateMany({
    where: { orderId, status: "PENDING" },
    data: { status: "FAILED", processedAt: new Date() },
  });

  for (const item of order.items) {
    if (item.variantId) {
      await tx.productVariant.update({
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

    await tx.inventoryTransaction.create({
      data: {
        productId: item.productId,
        variantId: item.variantId,
        orderId,
        type: "IN",
        source: "CANCELLATION",
        quantity: item.quantity,
        reference: orderId,
        note: "Hoàn kho do hủy đơn hàng.",
        idempotencyKey: inventoryMovementKey(
          "CANCELLATION",
          orderId,
          item.productId,
          item.variantId,
        ),
        userId: options.actorId,
      },
    });
  }

  if (order.pointsUsed > 0 && !order.pointsRestoredAt) {
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
