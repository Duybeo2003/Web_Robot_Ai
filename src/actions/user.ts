"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { normalizeVietnamPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function updateUserProfile(input: unknown) {
  try {
    const user = await requireUser();
    const data = z.object({
      name: z.string().trim().min(2).max(100),
      phoneNumber: z.string().transform((value, context) => {
        const phone = normalizeVietnamPhone(value);
        if (!phone) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
        return phone || "";
      }),
    }).parse(input);
    await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name, phoneNumber: data.phoneNumber },
    });
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_PROFILE_ERROR]", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "Số điện thoại đã được dùng bởi tài khoản khác." };
    }
    return { error: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ." };
  }
}
