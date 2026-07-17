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
    return { success: true }
  } catch (error) {
    console.error("Failed to update order:", error)
    return { success: false, error: "Failed to update order" }
  }
}
