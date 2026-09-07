import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type VnPaySettlementResult =
  | "confirmed"
  | "already-confirmed"
  | "failed"
  | "not-found"
  | "amount-mismatch"
  | "order-unavailable";

export async function settleVnPayPayment(
  params: Record<string, string>,
): Promise<VnPaySettlementResult> {
  const orderId = params.vnp_TxnRef;
  if (!orderId) return "not-found";

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        paymentTransactions: {
          where: { provider: "VNPAY" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    const payment = order?.paymentTransactions[0];
    if (!order || !payment) return "not-found";
    if (payment.status === "SUCCEEDED") return "already-confirmed";

    const receivedAmount = Number(params.vnp_Amount || 0) / 100;
    if (!Number.isFinite(receivedAmount) || receivedAmount !== Number(payment.amount)) {
      return "amount-mismatch";
    }

    const isSuccessful =
      params.vnp_ResponseCode === "00" &&
      params.vnp_TransactionStatus === "00";

    if (isSuccessful && order.status === "CANCELLED") {
      return "order-unavailable";
    }

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
        status: "PROCESSING",
        inventoryReservedUntil: null,
      },
    });

    return "confirmed";
  });
}
