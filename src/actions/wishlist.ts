"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleWishlist(productId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để sử dụng tính năng này." }
  }

  try {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id }
      })
      revalidatePath("/shop")
      revalidatePath(`/shop/[slug]`, 'page')
      revalidatePath("/profile/wishlist")
      return { success: true, isWished: false }
    } else {
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          productId: productId
        }
      })
      revalidatePath("/shop")
      revalidatePath(`/shop/[slug]`, 'page')
      revalidatePath("/profile/wishlist")
      return { success: true, isWished: true }
    }
  } catch (error) {
    console.error("Wishlist error:", error)
    return { success: false, error: "Đã xảy ra lỗi. Vui lòng thử lại sau." }
  }
}
