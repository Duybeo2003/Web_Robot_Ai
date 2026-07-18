"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitReview(productId: string, formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để đánh giá." }
  }

  const rating = parseInt(formData.get("rating") as string)
  const comment = formData.get("comment") as string

  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: "Vui lòng chọn số sao hợp lệ." }
  }

  if (!comment || comment.trim().length < 5) {
    return { success: false, error: "Đánh giá quá ngắn." }
  }

  try {
    await prisma.review.create({
      data: {
        rating,
        comment: comment.trim(),
        userId: session.user.id,
        productId
      }
    })

    revalidatePath(`/shop/[slug]`, 'page')
    return { success: true }
  } catch (error) {
    console.error("Failed to submit review:", error)
    return { success: false, error: "Gửi đánh giá thất bại. Vui lòng thử lại." }
  }
}
