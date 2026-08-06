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
      isClaimed: false,
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

    if (!item || item.userId !== session.user.id || item.isClaimed) {
      throw new Error("Vật phẩm không hợp lệ hoặc đã được sử dụng");
    }

    // Sell for 50% of original price in Xu (1 Xu = 1 VNĐ)
    const priceInVnd = Number(item.product.price);
    const xuEarned = Math.floor(priceInVnd * 0.5);

    // Update inventory item to claimed
    await tx.userInventory.update({
      where: { id: inventoryId },
      data: { isClaimed: true }
    });

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
        description: `Bán vật phẩm: ${item.product.name} (Tỉ lệ 50%)`
      }
    });

    revalidatePath("/profile/inventory");
    return xuEarned;
  });
}
