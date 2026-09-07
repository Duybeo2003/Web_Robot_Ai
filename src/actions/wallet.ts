"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function getWallet() {
  const user = await requireUser();
  return prisma.userWallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
  });
}

export async function getWalletTransactions() {
  const wallet = await getWallet();
  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createTopupRequest(input: unknown) {
  const user = await requireUser();
  const amount = z.number().int().min(10_000).max(100_000_000).parse(input);
  const rateLimit = await checkRateLimit(`rl:wallet-topup:${user.id}`, 5, 3600, {
    failClosed: true,
  });
  if (!rateLimit.success) throw new Error("Bạn đã tạo quá nhiều yêu cầu nạp Xu.");

  const wallet = await prisma.userWallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
  });
  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: "TOPUP",
      status: "PENDING",
      description: `Nạp ${amount} Xu qua chuyển khoản`,
    },
  });
  revalidatePath("/profile/wallet");
  return transaction;
}
