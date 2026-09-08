import "server-only";

import type { Prisma } from "@prisma/client";
import { lockOrderRow } from "@/lib/orders/lock-order";
import { prisma } from "@/lib/prisma";

export type VnPaySettlementResult =
  | "confirmed"
  | "already-confirmed"
  | "captured-after-cancellation"
  | "failed"
  | "not-found"
  | "amount-mismatch"
  | "order-unavailable";

export async function settleVnPayPayment(
  params: Record<string, string>,
): Promise<VnPaySettlementResult> {
  const reference = params.vnp_TxnRef;
  if (!reference) return "not-found";

  return prisma.$transaction(async (tx) => {
    const initialPayment = await tx.paymentTransaction.findFirst({
      where: {
        provider: "VNPAY",
        OR: [{ id: reference }, { orderId: reference }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderId: true },
    });
    if (!initialPayment) return "not-found";

    await lockOrderRow(tx, initialPayment.orderId);
    const [order, payment] = await Promise.all([
      tx.order.findUnique({ where: { id: initialPayment.orderId } }),
      tx.paymentTransaction.findUnique({ where: { id: initialPayment.id } }),
    ]);
    if (!order || !payment) return "not-found";
    if (payment.status === "SUCCEEDED") return "already-confirmed";

    const siblingSuccess = await tx.paymentTransaction.findFirst({
      where: {
        orderId: order.id,
        provider: "VNPAY",
        status: "SUCCEEDED",
        id: { not: payment.id },
      },
      select: { id: true },
    });
    if (siblingSuccess) return "already-confirmed";

    const receivedAmount = Number(params.vnp_Amount || 0) / 100;
    if (!Number.isSafeInteger(receivedAmount) || receivedAmount !== Number(payment.amount)) {
      return "amount-mismatch";
    }

    const isSuccessful =
      params.vnp_ResponseCode === "00" &&
      params.vnp_TransactionStatus === "00";

    if (!isSuccessful) {
      await tx.paymentTransaction.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "FAILED",
          providerTransactionId: params.vnp_TransactionNo || undefined,
          rawResponse: params as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      return "failed";
    }

    if (order.status === "CANCELLED") {
      const captured = await tx.paymentTransaction.updateMany({
        where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
        data: {
          status: "SUCCEEDED",
          providerTransactionId: params.vnp_TransactionNo || undefined,
          rawResponse: params as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      if (captured.count === 0) return "already-confirmed";

      const amountPaid = Number(order.amountPaid) + receivedAmount;
      await tx.order.update({
        where: { id: order.id },
        data: {
          amountPaid,
          amountDue: 0,
          paymentStatus:
            amountPaid >= Number(order.totalAmount) ? "PAID" : "PARTIALLY_PAID",
          inventoryReservedUntil: null,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "payment.vnpay_captured_after_cancellation",
          model: "Order",
          recordId: order.id,
          after: {
            paymentId: payment.id,
            amount: receivedAmount,
            providerTransactionId: params.vnp_TransactionNo || null,
            refundRequired: true,
          },
        },
      });
      return "captured-after-cancellation";
    }

    const claimed = await tx.paymentTransaction.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
      data: {
        status: "SUCCEEDED",
        providerTransactionId: params.vnp_TransactionNo || undefined,
        rawResponse: params as Prisma.InputJsonValue,
        processedAt: new Date(),
      },
    });
    if (claimed.count === 0) return "already-confirmed";

    const amountPaid = Number(order.amountPaid) + receivedAmount;
    const amountDue = Math.max(0, Number(order.totalAmount) - amountPaid);
    await tx.order.update({
      where: { id: order.id },
      data: {
        amountPaid,
        amountDue,
        paymentStatus: amountDue === 0 ? "PAID" : "PARTIALLY_PAID",
        status: order.status === "PENDING" ? "PROCESSING" : order.status,
        inventoryReservedUntil: null,
      },
    });

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

    await tx.auditLog.create({
      data: {
        action: "payment.vnpay_confirmed",
        model: "Order",
        recordId: order.id,
        after: {
          paymentId: payment.id,
          amount: receivedAmount,
          amountPaid,
          amountDue,
        },
      },
    });
    return "confirmed";
  });
}
