"use server"

import { prisma } from "@/lib/prisma"

export async function generateOtp(phoneNumber: string) {
  try {
    // Basic validation
    if (!phoneNumber || phoneNumber.length < 9) {
      return { success: false, error: "Số điện thoại không hợp lệ." }
    }

    // Generate a random 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Save to DB
    await prisma.otpCode.create({
      data: {
        phoneNumber,
        code,
        expiresAt,
      }
    })

    // Simulate sending SMS via console.log for development mode
    console.log(`\n\n=== MOCK SMS GATEWAY ===\nTo: ${phoneNumber}\nYour OTP is: ${code}\n========================\n\n`)

    return { success: true }
  } catch (error) {
    console.error("Failed to generate OTP:", error)
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo OTP." }
  }
}
