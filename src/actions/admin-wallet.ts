"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import { z } from "zod";

const idSchema = z.string().min(1).max(191);

export async function getPendingTopups() {
  await requireRole("ADMIN");

  const transactions = await prisma.walletTransaction.findMany({
    where: { 
      type: "TOPUP",
      status: "PENDING"
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      wallet: {
        select: {
          id: true,
          user: { select: { name: true, email: true, phoneNumber: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function approveTopup(transactionId: string) {
  const operator = await requireRole("ADMIN");
  transactionId = idSchema.parse(transactionId);

  // Use a transaction to ensure atomicity
  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });

    if (!t || t.status !== "PENDING" || t.type !== "TOPUP") {
      throw new Error("Invalid transaction");
    }

    const claimed = await tx.walletTransaction.updateMany({
      where: { id: transactionId, status: "PENDING", type: "TOPUP" },
      data: { status: "COMPLETED" },
    });
    if (claimed.count === 0) throw new Error("Transaction was already processed");

    // Add balance to wallet
    await tx.userWallet.update({
      where: { id: t.walletId },
      data: {
        balance: {
          increment: t.amount,
        },
      },
    });

    return tx.walletTransaction.findUniqueOrThrow({ where: { id: transactionId } });
  });

  await recordAudit({
    actorId: operator.id,
    action: "wallet.topup_approved",
    model: "WalletTransaction",
    recordId: transactionId,
    after: { status: "COMPLETED", amount: Number(transaction.amount) },
  });

  revalidatePath("/admin/wallet");
  return { success: true as const };
}

export async function rejectTopup(transactionId: string) {
  const operator = await requireRole("ADMIN");
  transactionId = idSchema.parse(transactionId);

  const updated = await prisma.walletTransaction.updateMany({
    where: { id: transactionId, status: "PENDING", type: "TOPUP" },
    data: { status: "REJECTED" },
  });
  if (updated.count === 0) throw new Error("Transaction was already processed");

  await recordAudit({
    actorId: operator.id,
    action: "wallet.topup_rejected",
    model: "WalletTransaction",
    recordId: transactionId,
    after: { status: "REJECTED" },
  });

  revalidatePath("/admin/wallet");
  return { success: true as const };
}
