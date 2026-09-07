"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

function maskName(name: string | null) {
  if (!name) return "Khách hàng RoboEQ";
  return name
    .split(/\s+/)
    .map((part) => `${part.slice(0, 1)}${"*".repeat(Math.max(1, part.length - 1))}`)
    .join(" ");
}

export async function lookupWarranty(input: string) {
  try {
    const serialNumber = z.string().trim().min(5).max(100).parse(input);
    const rateLimit = await checkRateLimit(
      `rl:warranty:${serialNumber.slice(0, 12)}`,
      10,
      60,
      { failClosed: true },
    );
    if (!rateLimit.success) return { error: "Bạn tra cứu quá nhanh. Vui lòng thử lại sau." };

    const warranty = await prisma.warranty.findUnique({
      where: { serialNumber },
      include: {
        product: { select: { title: true, imageUrl: true } },
        user: { select: { name: true, phoneNumber: true } },
      },
    });
    if (!warranty) return { error: "Không tìm thấy thông tin bảo hành." };

    return {
      success: true,
      warranty: {
        ...warranty,
        user: {
          name: maskName(warranty.user.name),
          phoneNumber: warranty.user.phoneNumber
            ? warranty.user.phoneNumber.replace(/.(?=.{4})/g, "*")
            : null,
        },
      },
    };
  } catch (error) {
    console.error("[WARRANTY_LOOKUP_ERROR]", error);
    return { error: "Thông tin tra cứu không hợp lệ." };
  }
}
