"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";

export async function getPendingTopups() {
  await requireRole("ADMIN");

  return prisma.walletTransaction.findMany({
    where: { 
      type: "TOPUP",
      status: "PENDING"
    },
    include: {
      wallet: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function approveTopup(transactionId: string) {
  await requireRole("ADMIN");

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

  revalidatePath("/admin/wallet");
  return transaction;
}

export async function rejectTopup(transactionId: string) {
  await requireRole("ADMIN");

  const updated = await prisma.walletTransaction.updateMany({
    where: { id: transactionId, status: "PENDING", type: "TOPUP" },
    data: { status: "REJECTED" },
  });
  if (updated.count === 0) throw new Error("Transaction was already processed");

  revalidatePath("/admin/wallet");
  return prisma.walletTransaction.findUniqueOrThrow({ where: { id: transactionId } });
}
