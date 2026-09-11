"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createVnPayUrl } from "@/lib/vnpay";
import { headers } from "next/headers";

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
  if (!process.env.BANK_ID || !process.env.BANK_ACCOUNT_NO || !process.env.BANK_ACCOUNT_NAME) {
    throw new Error("Kênh nạp Xu bằng chuyển khoản chưa được cấu hình.");
  }
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

export async function createVnPayWalletTopup(input: unknown) {
  const user = await requireUser();
  const amount = z.number().int().min(10_000).max(100_000_000).parse(input);
  const rateLimit = await checkRateLimit(`rl:wallet-vnpay:${user.id}`, 5, 3600, {
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
      description: `Nạp ${amount.toLocaleString("vi-VN")} Xu qua VNPay`,
    },
  });

  // Get client IP from headers
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const ipAddr = forwarded?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "127.0.0.1";

  // Return URL for wallet topup (separate from order return URL)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  const walletReturnUrl = `${baseUrl}/profile/wallet?payment=done`;

  const paymentUrl = createVnPayUrl(
    `wallet:${transaction.id}`,
    amount,
    ipAddr,
    transaction.id,
    walletReturnUrl,
  );

  return { paymentUrl, transactionId: transaction.id };
}
