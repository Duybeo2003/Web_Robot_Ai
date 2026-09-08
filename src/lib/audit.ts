import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type AuditPayload = {
  actorId?: string;
  action: string;
  model: string;
  recordId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

export async function recordAudit(payload: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.actorId,
        action: payload.action,
        model: payload.model,
        recordId: payload.recordId,
        before: payload.before,
        after: payload.after,
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", {
      action: payload.action,
      model: payload.model,
      recordId: payload.recordId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
