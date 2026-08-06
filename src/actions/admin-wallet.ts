"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingTopups() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

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
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Use a transaction to ensure atomicity
  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });

    if (!t || t.status !== "PENDING" || t.type !== "TOPUP") {
      throw new Error("Invalid transaction");
    }

    // Mark as completed
    const updatedTx = await tx.walletTransaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    });

    // Add balance to wallet
    await tx.userWallet.update({
      where: { id: t.walletId },
      data: {
        balance: {
          increment: t.amount,
        },
      },
    });

    return updatedTx;
  });

  revalidatePath("/admin/wallet");
  return transaction;
}

export async function rejectTopup(transactionId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const updatedTx = await prisma.walletTransaction.update({
    where: { id: transactionId, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/wallet");
  return updatedTx;
}
