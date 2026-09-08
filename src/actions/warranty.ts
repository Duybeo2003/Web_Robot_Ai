"use server";

import { z } from "zod";
import type { WarrantyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestFingerprint } from "@/lib/request-fingerprint";

function maskName(name: string | null) {
  if (!name) return "Khách hàng RoboEQ";
  return name
    .split(/\s+/)
    .map((part) => `${part.slice(0, 1)}${"*".repeat(Math.max(1, part.length - 1))}`)
    .join(" ");
}

export type WarrantySummary = {
  serialNumber: string;
  status: WarrantyStatus;
  startDate: Date;
  endDate: Date;
  product: { title: string; imageUrl: string | null };
  user: { name: string; phoneNumber: string | null };
};

export async function lookupWarranty(input: string) {
  try {
    const serialNumber = z.string().trim().min(5).max(100).parse(input);
    const fingerprint = await getRequestFingerprint();
    const [serialLimit, addressLimit] = await Promise.all([
      checkRateLimit(`rl:warranty:serial:${serialNumber.slice(0, 12)}`, 10, 60, {
        failClosed: true,
      }),
      checkRateLimit(`rl:warranty:address:${fingerprint}`, 30, 60, { failClosed: true }),
    ]);
    if (!serialLimit.success || !addressLimit.success) {
      return { error: "Bạn tra cứu quá nhanh. Vui lòng thử lại sau." };
    }

    const warranty = await prisma.warranty.findUnique({
      where: { serialNumber },
      select: {
        serialNumber: true,
        status: true,
        startDate: true,
        endDate: true,
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
      } satisfies WarrantySummary,
    };
  } catch (error) {
    console.error("[WARRANTY_LOOKUP_ERROR]", error);
    return { error: "Thông tin tra cứu không hợp lệ." };
  }
}
