"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeVietnamPhone } from "@/lib/phone";
import { hashOtp } from "@/lib/otp";
import { getRequestFingerprint } from "@/lib/request-fingerprint";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

async function sendOtp(phoneNumber: string, code: string) {
  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (!webhookUrl) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[DEV_OTP] ${phoneNumber}: ${code}`);
      return;
    }
    throw new Error("Dịch vụ SMS chưa được cấu hình.");
  }
  if (process.env.NODE_ENV === "production" && !webhookUrl.startsWith("https://")) {
    throw new Error("Dịch vụ SMS phải sử dụng HTTPS.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SMS_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      to: phoneNumber,
      message: `Ma xac thuc RoboEQ cua ban la ${code}. Ma co hieu luc trong 5 phut.`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Không thể gửi mã xác thực.");
}

export async function generateOtp(rawPhoneNumber: string) {
  const phoneNumber = normalizeVietnamPhone(rawPhoneNumber);
  if (!phoneNumber) {
    return { success: false, error: "Số điện thoại không hợp lệ." };
  }

  try {
    const fingerprint = await getRequestFingerprint();
    const [phoneLimit, addressLimit] = await Promise.all([
      checkRateLimit(`rl:otp:phone:${phoneNumber}`, 3, 300, { failClosed: true }),
      checkRateLimit(`rl:otp:address:${fingerprint}`, 10, 300, { failClosed: true }),
    ]);
    if (!phoneLimit.success || !addressLimit.success) {
      return {
        success: false,
        error: "Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 5 phút.",
      };
    }

    const code = crypto.randomInt(100000, 1_000_000).toString();
    await prisma.$transaction([
      prisma.otpCode.deleteMany({ where: { phoneNumber } }),
      prisma.otpCode.create({
        data: {
          phoneNumber,
          code: hashOtp(phoneNumber, code),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      }),
    ]);
    try {
      await sendOtp(phoneNumber, code);
    } catch (error) {
      await prisma.otpCode.deleteMany({ where: { phoneNumber } });
      throw error;
    }
    return { success: true };
  } catch (error) {
    logger.error("auth.generate_otp_failed", { error });
    return {
      success: false,
      error: "Không thể gửi mã xác thực lúc này. Vui lòng thử lại sau.",
    };
  }
}
