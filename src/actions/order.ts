"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentStatus: PaymentStatus) {
  try {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status, paymentStatus }
    })

    revalidatePath('/admin/orders')
    revalidatePath('/profile/orders')
    return { success: true }
  } catch (error) {
    console.error("Update order error:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) return { success: false, error: "Order not found" }
    
    // Only allow cancelling if it belongs to the user and is PENDING
    if (order.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" }
    }
    
    if (order.status !== "PENDING") {
      return { success: false, error: "Cannot cancel order that is already being processed" }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    })

    revalidatePath('/profile/orders')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error("Cancel order error:", error)
    return { success: false, error: "Failed to cancel order" }
  }
}
