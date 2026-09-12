"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestFingerprint } from "@/lib/request-fingerprint";
import { logger } from "@/lib/logger";

const couponCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((value) => value.toUpperCase());

export async function validateCoupon(code: string, rawSubtotal: number) {
  try {
    const fingerprint = await getRequestFingerprint();
    const rateLimit = await checkRateLimit(`rl:coupon:${fingerprint}`, 30, 60, {
      failClosed: true,
    });
    if (!rateLimit.success) {
      return { success: false, error: "Bạn đang thử mã quá nhanh. Vui lòng đợi một phút." };
    }
    const normalizedCode = couponCodeSchema.parse(code);
    const subtotal = z.number().int().min(0).max(100_000_000_000).parse(rawSubtotal);
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return { success: false, error: "Mã giảm giá không tồn tại." };
    }

    if (!coupon.isActive) {
      return { success: false, error: "Mã giảm giá đã bị khóa." };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { success: false, error: "Mã giảm giá đã hết hạn." };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { success: false, error: "Mã giảm giá đã hết lượt sử dụng." };
    }
    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      return {
        success: false,
        error: `Mã này áp dụng cho đơn từ ${Number(coupon.minOrderValue).toLocaleString("vi-VN")}đ.`,
      };
    }

    const discountAmount = Math.min(
      subtotal,
      Math.max(
        0,
        Math.round(
          coupon.discountPercent
            ? subtotal * (coupon.discountPercent / 100)
            : Number(coupon.discountValue || 0),
        ),
      ),
    );

    return {
      success: true,
      discountAmount,
      discountPercent: coupon.discountPercent,
      discountValue: coupon.discountValue ? Number(coupon.discountValue) : null,
      isFreeship: coupon.isFreeship || false,
    };
  } catch (error) {
    logger.error("coupon.validate_failed", { error });
    return { success: false, error: "Có lỗi xảy ra khi kiểm tra mã." };
  }
}
