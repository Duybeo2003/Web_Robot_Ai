import { NextResponse } from "next/server";
import { verifyVnPayReturn } from "@/lib/vnpay";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());

  if (!verifyVnPayReturn(params)) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid checksum" });
  }

  try {
    const txnRef = params.vnp_TxnRef || "";
    // Reference format: "wallet:{transactionId}"
    if (!txnRef.startsWith("wallet:")) {
      return NextResponse.json({ RspCode: "01", Message: "Invalid reference" });
    }
    const transactionId = txnRef.slice("wallet:".length);
    if (!transactionId) {
      return NextResponse.json({ RspCode: "01", Message: "Invalid transaction ID" });
    }

    const result = await settleWalletTopup(transactionId, params);

    if (result === "not-found") {
      return NextResponse.json({ RspCode: "01", Message: "Transaction not found" });
    }
    if (result === "amount-mismatch") {
      return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
    }
    if (result === "already-confirmed") {
      return NextResponse.json({ RspCode: "02", Message: "Already confirmed" });
    }

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    logger.error("vnpay.wallet_ipn_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ RspCode: "99", Message: "Internal error" });
  }
}

type WalletSettleResult =
  | "confirmed"
  | "already-confirmed"
  | "failed"
  | "not-found"
  | "amount-mismatch";

async function settleWalletTopup(
  transactionId: string,
  params: Record<string, string>,
): Promise<WalletSettleResult> {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction || transaction.type !== "TOPUP") return "not-found";
    if (transaction.status !== "PENDING") return "already-confirmed";

    const receivedAmount = Math.round(Number(params.vnp_Amount || 0) / 100);
    if (receivedAmount !== transaction.amount) return "amount-mismatch";

    const isSuccessful =
      params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";

    if (!isSuccessful) {
      await tx.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: "REJECTED",
          providerReference: params.vnp_TransactionNo || null,
          description: `Nạp thất bại qua VNPay: ${params.vnp_ResponseCode || "unknown"}`,
        } as Prisma.WalletTransactionUpdateInput,
      });
      logger.warn("wallet.vnpay_topup_failed", {
        transactionId,
        responseCode: params.vnp_ResponseCode,
      });
      return "failed";
    }

    // Credit wallet balance atomically
    await tx.walletTransaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        providerReference: params.vnp_TransactionNo || null,
      } as Prisma.WalletTransactionUpdateInput,
    });

    await tx.userWallet.update({
      where: { id: transaction.walletId },
      data: { balance: { increment: transaction.amount } },
    });

    logger.info("wallet.vnpay_topup_confirmed", {
      transactionId,
      walletId: transaction.walletId,
      amount: transaction.amount,
    });

    return "confirmed";
  });
}
