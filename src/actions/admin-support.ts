"use server";

import type { ContactRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1).max(191);
const statusSchema = z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]);

export async function updateContactRequestStatus(
  rawId: string,
  rawStatus: ContactRequestStatus,
  formData: FormData,
) {
  void formData;
  const operator = await requireRole("ADMIN");
  const id = idSchema.parse(rawId);
  const status = statusSchema.parse(rawStatus);
  const request = await prisma.contactRequest.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!request) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");
  if (request.status === status) return;

  await prisma.contactRequest.update({ where: { id }, data: { status } });
  await recordAudit({
    actorId: operator.id,
    action: "support.status_update",
    model: "ContactRequest",
    recordId: id,
    before: { status: request.status },
    after: { status },
  });
  revalidatePath("/admin/support");
}
