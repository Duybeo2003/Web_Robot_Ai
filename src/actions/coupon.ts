"use server"

import { prisma } from "@/lib/prisma"

export async function validateCoupon(code: string) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!coupon) {
      return { success: false, error: "Mã giảm giá không tồn tại." }
    }

    if (!coupon.isActive) {
      return { success: false, error: "Mã giảm giá đã bị khóa." }
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { success: false, error: "Mã giảm giá đã hết hạn." }
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { success: false, error: "Mã giảm giá đã hết lượt sử dụng." }
    }

    return { 
      success: true, 
      discountPercent: coupon.discountPercent 
    }
  } catch (error) {
    console.error("Coupon validation error:", error)
    return { success: false, error: "Có lỗi xảy ra khi kiểm tra mã." }
  }
}
