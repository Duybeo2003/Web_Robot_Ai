"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function generateOtp(phoneNumber: string) {
  try {
    // Basic validation
    if (!phoneNumber || phoneNumber.length < 9) {
      return { success: false, error: "Số điện thoại không hợp lệ." };
    }

    // Fix #6: Delete old OTPs for this phone number first to prevent accumulation
    await prisma.otpCode.deleteMany({
      where: { phoneNumber },
    });

    // Fix #6: Use crypto.randomInt instead of Math.random for secure OTP generation
    const code = crypto.randomInt(100000, 999999).toString();

    // Expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save to DB
    await prisma.otpCode.create({
      data: {
        phoneNumber,
        code,
        expiresAt,
      },
    });

    // Simulate sending SMS via console.log for development mode
    console.log(
      `\n\n=== MOCK SMS GATEWAY ===\nTo: ${phoneNumber}\nYour OTP is: ${code}\n========================\n\n`,
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to generate OTP:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo OTP." };
  }
}
