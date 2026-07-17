"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateUserProfile(data: { name: string; phoneNumber: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Vui lòng đăng nhập" }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
      }
    })

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { error: "Có lỗi xảy ra khi cập nhật hồ sơ" }
  }
}
