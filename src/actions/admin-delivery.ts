"use server";

import type { DeliveryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const statuses = z.enum(["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]);
const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function getAdminDeliveries() {
  await requireRole("ADMIN");
  return prisma.deliveryRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phoneNumber: true } },
      inventoryItem: { include: { product: true } },
    },
  });
}

export async function updateDeliveryStatus(
  rawId: string,
  rawStatus: DeliveryStatus,
  rawTrackingCode?: string,
) {
  await requireRole("ADMIN");
  const id = z.string().min(1).max(191).parse(rawId);
  const status = statuses.parse(rawStatus);
  const trackingCode = rawTrackingCode?.trim().slice(0, 191);

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliveryRequest.findUnique({ where: { id } });
    if (!delivery) throw new Error("Yêu cầu giao hàng không tồn tại.");
    if (delivery.status === status) return delivery;
    if (!transitions[delivery.status].includes(status)) {
      throw new Error(`Không thể chuyển từ ${delivery.status} sang ${status}.`);
    }
    if (status === "SHIPPED" && !trackingCode) {
      throw new Error("Cần nhập mã vận đơn trước khi giao hàng.");
    }

    const updated = await tx.deliveryRequest.update({
      where: { id },
      data: { status, ...(trackingCode !== undefined ? { trackingCode } : {}) },
    });
    if (status === "CANCELLED") {
      await tx.userInventory.update({
        where: { id: delivery.inventoryItemId },
        data: { status: "AVAILABLE", isClaimed: false },
      });
    } else if (status === "DELIVERED") {
      await tx.userInventory.update({
        where: { id: delivery.inventoryItemId },
        data: { status: "DELIVERED" },
      });
    }
    return updated;
  });
  revalidatePath("/admin/deliveries");
  return result;
}
