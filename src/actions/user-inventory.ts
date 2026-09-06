"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getUserInventory() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return prisma.userInventory.findMany({
    where: {
      userId: session.user.id,
      status: "AVAILABLE",
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function sellItemForXu(inventoryId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.userInventory.findUnique({
      where: { id: inventoryId },
      include: { product: true }
    });

    if (!item || item.userId !== session.user.id || item.status !== "AVAILABLE") {
      throw new Error("Vật phẩm không hợp lệ hoặc đã được sử dụng");
    }

    // Sell for admin configured price, or fallback to 100% of product price
    const priceInVnd = Number(item.product.price);
    const xuEarned = item.sellPriceXu !== null ? item.sellPriceXu : Math.floor(priceInVnd);

    // Update inventory item to claimed, atomically checking status
    const updateResult = await tx.userInventory.updateMany({
      where: { id: inventoryId, status: "AVAILABLE" },
      data: { status: "SOLD", isClaimed: true }
    });

    if (updateResult.count === 0) {
      throw new Error("Vật phẩm đã được bán hoặc không khả dụng!");
    }

    // Add Xu to wallet
    const wallet = await tx.userWallet.findUnique({
      where: { userId: session.user.id }
    });

    if (!wallet) throw new Error("Wallet not found");

    await tx.userWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: xuEarned } }
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: xuEarned,
        type: "REWARD", 
        status: "COMPLETED",
        description: `Bán vật phẩm: ${item.product.title}`
      }
    });

    revalidatePath("/profile/inventory");
    return xuEarned;
  });
}

export async function requestDelivery(inventoryId: string, address: { name: string, phone: string, address: string, notes?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.userInventory.findUnique({
      where: { id: inventoryId }
    });

    if (!item || item.userId !== session.user.id || item.status !== "AVAILABLE") {
      throw new Error("Vật phẩm không hợp lệ hoặc không khả dụng");
    }

    // Create delivery request
    await tx.deliveryRequest.create({
      data: {
        userId: session.user.id,
        inventoryItemId: inventoryId,
        recipientName: address.name,
        phoneNumber: address.phone,
        address: address.address,
        notes: address.notes,
        shippingFee: 0, // Events items are freeship for now
      }
    });

    // Update item status
    await tx.userInventory.update({
      where: { id: inventoryId },
      data: { status: "PENDING_DELIVERY", isClaimed: true }
    });

    revalidatePath("/profile/inventory");
  });
}
