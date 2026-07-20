"use server"

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function updateOrderStatus(orderId: string, data: { status?: string, paymentStatus?: string }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const updateData: any = {}
    if (data.status) updateData.status = data.status
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    })

    revalidatePath("/admin/orders")
    revalidatePath("/profile/orders")
    return { success: true }
  } catch (error) {
    console.error("Failed to update order:", error)
    return { success: false, error: "Failed to update order" }
  }
}

export async function pushOrderToLogistics(orderId: string, provider: 'GHN' | 'GHTK') {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: "Order not found" }

    // MOCK: Giả lập đẩy đơn qua API của hãng vận chuyển
    console.log(`[LOGISTICS] Pushing order ${orderId} to ${provider}...`)
    
    // Fallback: nếu gọi API thật sẽ có đoạn fetch() ở đây
    const trackingCode = `${provider}-${Date.now().toString().slice(-6)}`
    
    // Cập nhật trạng thái đơn hàng thành SHIPPED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    })

    revalidatePath("/admin/orders")
    revalidatePath("/profile/orders")
    return { success: true, trackingCode }
  } catch (error) {
    console.error(`Failed to push order to ${provider}:`, error)
    return { success: false, error: `Failed to push order to ${provider}` }
  }
}


export async function upsertProduct(data: any, id?: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  const productData = {
    title: data.title,
    description: data.description,
    price: data.price,
    type: data.type,
    inventoryCount: data.inventoryCount,
    imageUrl: data.imageUrl,
    originalPrice: data.originalPrice || null,
    flashSaleActive: data.flashSaleActive || false,
    flashSaleEndDate: data.flashSaleActive && data.flashSaleEndDate ? new Date(data.flashSaleEndDate) : null,
    flashSaleStock: data.flashSaleActive ? data.flashSaleStock : 0,
    ...(data.categoryId ? { categoryId: data.categoryId } : {}),
  }

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: productData,
      })
    } else {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
      await prisma.product.create({
        data: {
          ...productData,
          slug,
        },
      })
    }
    revalidatePath("/admin/products")
    revalidatePath("/") // revalidate store
    return { success: true }
  } catch (error) {
    console.error("Failed to upsert product:", error)
    return { success: false, error: "Lỗi lưu sản phẩm" }
  }
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  // Prevent changing own role
  if (session.user.id === userId) {
    return { success: false, error: "Cannot change your own role" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to update user role:", error)
    return { success: false, error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  if (session.user.id === userId) {
    return { success: false, error: "Cannot delete yourself" }
  }

  try {
    // We use soft delete based on schema or hard delete? Schema has `deletedAt`. Let's soft delete.
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function upsertCategory(data: { name: string, description?: string }, id?: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  try {
    if (id) {
      await prisma.category.update({
        where: { id },
        data,
      })
    } else {
      await prisma.category.create({
        data,
      })
    }
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    console.error("Failed to upsert category:", error)
    return { success: false, error: "Failed to save category" }
  }
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  try {
    await prisma.category.delete({
      where: { id },
    })
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false, error: "Failed to delete category. Lỗi: Có thể do danh mục này đang chứa sản phẩm." }
  }
}

export async function upsertCoupon(data: { code: string, discountPercent: number, usageLimit?: number | null, expiresAt?: Date | null }, id?: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  try {
    if (id) {
      await prisma.coupon.update({
        where: { id },
        data,
      })
    } else {
      await prisma.coupon.create({
        data,
      })
    }
    revalidatePath("/admin/coupons")
    return { success: true }
  } catch (error) {
    console.error("Failed to upsert coupon:", error)
    return { success: false, error: "Failed to save coupon. Mã có thể đã tồn tại." }
  }
}

export async function deleteCoupon(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  try {
    await prisma.coupon.delete({
      where: { id },
    })
    revalidatePath("/admin/coupons")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete coupon:", error)
    return { success: false, error: "Failed to delete coupon." }
  }
}

export async function deleteReview(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (currentUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  try {
    await prisma.review.delete({
      where: { id },
    })
    revalidatePath("/admin/reviews")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete review:", error)
    return { success: false, error: "Failed to delete review." }
  }
}
