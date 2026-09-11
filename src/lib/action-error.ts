import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthorizationError } from "@/lib/authz";
import { logger } from "@/lib/logger";

export function actionError(error: unknown, fallback: string) {
  logger.error("admin_action.error", { fallback, error });
  if (error instanceof AuthorizationError) {
    return { success: false as const, error: "Bạn không có quyền thực hiện thao tác này." };
  }
  if (error instanceof z.ZodError) {
    return { success: false as const, error: error.issues[0]?.message || "Dữ liệu không hợp lệ." };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      success: false as const,
      error: error.code === "P2002" ? "Dữ liệu bị trùng với bản ghi hiện có." : fallback,
    };
  }
  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return { success: false as const, error: fallback };
  }
  return { success: false as const, error: error instanceof Error ? error.message : fallback };
}
