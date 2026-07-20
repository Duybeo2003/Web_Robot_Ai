"use server"

import { prisma } from "@/lib/prisma"

export async function lookupWarranty(serialNumber: string) {
  if (!serialNumber) return { error: "Vui lòng nhập Serial Number" }

  try {
    const warranty = await prisma.warranty.findUnique({
      where: { serialNumber },
      include: {
        product: {
          select: { title: true, imageUrl: true }
        },
        user: {
          select: { name: true, phoneNumber: true }
        }
      }
    })

    if (!warranty) {
      return { error: "Không tìm thấy thông tin bảo hành cho Serial này." }
    }

    return { success: true, warranty }
  } catch (e: any) {
    console.error("[WARRANTY_LOOKUP]", e)
    return { error: "Lỗi hệ thống khi tra cứu bảo hành." }
  }
}
