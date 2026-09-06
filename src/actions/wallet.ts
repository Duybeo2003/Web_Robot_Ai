"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getWallet() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  let wallet = await prisma.userWallet.findUnique({
    where: { userId: session.user.id },
  });

  if (!wallet) {
    wallet = await prisma.userWallet.create({
      data: {
        userId: session.user.id,
        balance: 0,
      },
    });
  }

  return wallet;
}

export async function getWalletTransactions() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const wallet = await getWallet();

  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTopupRequest(amount: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const wallet = await getWallet();

  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: amount,
      type: "TOPUP",
      status: "PENDING",
      description: `Nạp ${amount} Xu qua Chuyển khoản`,
    },
  });

  revalidatePath("/profile/wallet");
  return transaction;
}
