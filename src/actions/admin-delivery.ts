"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAdminDeliveries() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.deliveryRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, phoneNumber: true }
      },
      inventoryItem: {
        include: {
          product: true
        }
      }
    }
  });
}

export async function updateDeliveryStatus(id: string, status: string, trackingCode?: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.deliveryRequest.findUnique({
      where: { id },
    });
    if (!delivery) throw new Error("Yêu cầu giao hàng không tồn tại");

    const updated = await tx.deliveryRequest.update({
      where: { id },
      data: { 
        status,
        ...(trackingCode !== undefined && { trackingCode })
      },
    });

    if (status === "REJECTED" || status === "CANCELLED") {
      // Revert inventory item to AVAILABLE
      await tx.userInventory.update({
        where: { id: delivery.inventoryItemId },
        data: { status: "AVAILABLE" }
      });
    } else if (status === "DELIVERED") {
      await tx.userInventory.update({
        where: { id: delivery.inventoryItemId },
        data: { status: "DELIVERED" }
      });
    }

    revalidatePath("/admin/deliveries");
    return updated;
  });
}
