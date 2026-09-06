"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(data: {
  name: string;
  phoneNumber: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Vui lòng đăng nhập" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    // Fix #14: Check for unique constraint violation (duplicate phone number)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { error: "Số điện thoại này đã được đăng ký bởi tài khoản khác." };
    }
    return { error: "Có lỗi xảy ra khi cập nhật hồ sơ" };
  }
}
