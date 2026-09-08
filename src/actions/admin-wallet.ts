"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import { z } from "zod";
import { AuthorizationError } from "@/lib/authz";
import { Prisma } from "@prisma/client";

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

export async function approveTopup(transactionId: string, rawReference: string) {
  try {
    const operator = await requireRole("ADMIN");
    transactionId = idSchema.parse(transactionId);
    const providerReference = z.string().trim().min(6).max(191).parse(rawReference);

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.walletTransaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true },
      });

      if (!t || t.status !== "PENDING" || t.type !== "TOPUP") {
        throw new Error("Yêu cầu nạp không còn chờ xử lý.");
      }

      const claimed = await tx.walletTransaction.updateMany({
        where: { id: transactionId, status: "PENDING", type: "TOPUP" },
        data: {
          status: "COMPLETED",
          providerReference,
          processedAt: new Date(),
        },
      });
      if (claimed.count === 0) throw new Error("Yêu cầu nạp vừa được xử lý ở phiên khác.");

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
      after: {
        status: "COMPLETED",
        amount: Number(transaction.amount),
        providerReference,
      },
    });

    revalidatePath("/admin/wallet");
    revalidatePath("/profile/wallet");
    return { success: true as const };
  } catch (error) {
    console.error("[APPROVE_TOPUP_ERROR]", error);
    return {
      success: false as const,
      error:
        error instanceof AuthorizationError
          ? "Bạn không có quyền duyệt nạp Xu."
          : error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
            ? "Mã đối soát này đã được dùng cho giao dịch khác."
            : error instanceof z.ZodError
              ? "Mã đối soát cần có từ 6 đến 191 ký tự."
              : error instanceof Error
                ? error.message
                : "Không thể duyệt yêu cầu nạp Xu.",
    };
  }
}

export async function rejectTopup(transactionId: string) {
  try {
    const operator = await requireRole("ADMIN");
    transactionId = idSchema.parse(transactionId);

    const updated = await prisma.walletTransaction.updateMany({
      where: { id: transactionId, status: "PENDING", type: "TOPUP" },
      data: { status: "REJECTED", processedAt: new Date() },
    });
    if (updated.count === 0) throw new Error("Yêu cầu nạp không còn chờ xử lý.");

    await recordAudit({
      actorId: operator.id,
      action: "wallet.topup_rejected",
      model: "WalletTransaction",
      recordId: transactionId,
      after: { status: "REJECTED" },
    });

    revalidatePath("/admin/wallet");
    revalidatePath("/profile/wallet");
    return { success: true as const };
  } catch (error) {
    console.error("[REJECT_TOPUP_ERROR]", error);
    return {
      success: false as const,
      error:
        error instanceof AuthorizationError
          ? "Bạn không có quyền từ chối yêu cầu này."
          : error instanceof Error
            ? error.message
            : "Không thể từ chối yêu cầu nạp Xu.",
    };
  }
}
