"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

const payoutSchema = z.object({
  commissionId: z.string().min(1).max(191),
  reference: z.string().trim().min(6).max(191),
});

export async function confirmCommissionPayout(rawCommissionId: string, rawReference: string) {
  try {
    const operator = await requireRole("ADMIN");
    const input = payoutSchema.parse({
      commissionId: rawCommissionId,
      reference: rawReference,
    });

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.commission.findUnique({
        where: { id: input.commissionId },
        include: { order: { select: { status: true, paymentStatus: true } } },
      });
      if (!current) throw new Error("Không tìm thấy khoản hoa hồng.");
      if (current.status === "PAID" && current.payoutReference === input.reference) {
        return { commission: current, changed: false };
      }
      if (current.status !== "PENDING") {
        throw new Error("Khoản hoa hồng không còn ở trạng thái chờ chi trả.");
      }
      if (current.order.status !== "COMPLETED" || current.order.paymentStatus !== "PAID") {
        throw new Error("Chỉ chi hoa hồng cho đơn đã giao và đã thanh toán đủ.");
      }

      const claimed = await tx.commission.updateMany({
        where: { id: current.id, status: "PENDING" },
        data: {
          status: "PAID",
          payoutReference: input.reference,
          paidAt: new Date(),
        },
      });
      if (claimed.count === 0) throw new Error("Khoản hoa hồng vừa được xử lý ở phiên khác.");
      return {
        commission: await tx.commission.findUniqueOrThrow({ where: { id: current.id } }),
        changed: true,
      };
    });

    if (result.changed) {
      await recordAudit({
        actorId: operator.id,
        action: "commission.payout_confirmed",
        model: "Commission",
        recordId: result.commission.id,
        before: { status: "PENDING" },
        after: {
          status: "PAID",
          amount: Number(result.commission.amount),
          reference: result.commission.payoutReference,
        },
      });
    }
    revalidatePath("/admin/commissions");
    revalidatePath("/profile/affiliate");
    return { success: true as const };
  } catch (error) {
    logger.error("commission.payout_failed", { error });
    return {
      success: false as const,
      error:
        error instanceof AuthorizationError
          ? "Bạn không có quyền xác nhận chi hoa hồng."
          : error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code === "P2002"
              ? "Mã giao dịch chi trả đã được sử dụng."
              : "Không thể ghi nhận khoản chi hoa hồng."
            : error instanceof Error
              ? error.message
              : "Không thể xác nhận chi hoa hồng.",
    };
  }
}
