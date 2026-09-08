"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { normalizeVietnamPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1).max(191);
const deliverySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().transform((value, context) => {
    const phone = normalizeVietnamPhone(value);
    if (!phone) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
    return phone || "";
  }),
  address: z.string().trim().min(8).max(500),
  notes: z.string().trim().max(1_000).optional(),
});

export async function getUserInventory() {
  const user = await requireUser();
  return prisma.userInventory.findMany({
    where: { userId: user.id, status: "AVAILABLE" },
    select: {
      id: true,
      quantity: true,
      sellPriceXu: true,
      product: { select: { title: true, description: true, imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function sellItemForXu(rawInventoryId: string) {
  const user = await requireUser();
  const inventoryId = idSchema.parse(rawInventoryId);
  const earned = await prisma.$transaction(async (tx) => {
    const item = await tx.userInventory.findFirst({
      where: { id: inventoryId, userId: user.id, status: "AVAILABLE" },
      include: { product: { select: { title: true } } },
    });
    if (!item) throw new Error("Vật phẩm không khả dụng.");
    if (item.sellPriceXu === null || item.sellPriceXu <= 0) {
      throw new Error("Vật phẩm này không được cấu hình giá bán lại.");
    }

    const claimed = await tx.userInventory.updateMany({
      where: { id: inventoryId, userId: user.id, status: "AVAILABLE" },
      data: { status: "SOLD", isClaimed: true },
    });
    if (claimed.count === 0) throw new Error("Vật phẩm đã được xử lý trước đó.");

    const wallet = await tx.userWallet.upsert({
      where: { userId: user.id },
      update: { balance: { increment: item.sellPriceXu } },
      create: { userId: user.id, balance: item.sellPriceXu },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: item.sellPriceXu,
        type: "REWARD",
        status: "COMPLETED",
        description: `Bán vật phẩm: ${item.product.title}`,
      },
    });
    return item.sellPriceXu;
  });
  revalidatePath("/profile/inventory");
  revalidatePath("/profile/wallet");
  return earned;
}

export async function requestDelivery(
  rawInventoryId: string,
  rawAddress: unknown,
) {
  const user = await requireUser();
  const inventoryId = idSchema.parse(rawInventoryId);
  const address = deliverySchema.parse(rawAddress);
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.userInventory.updateMany({
      where: { id: inventoryId, userId: user.id, status: "AVAILABLE" },
      data: { status: "PENDING_DELIVERY", isClaimed: true },
    });
    if (claimed.count === 0) throw new Error("Vật phẩm không khả dụng.");

    await tx.deliveryRequest.create({
      data: {
        userId: user.id,
        inventoryItemId: inventoryId,
        recipientName: address.name,
        phoneNumber: address.phone,
        address: address.address,
        notes: address.notes,
        shippingFee: 0,
      },
    });
  });
  revalidatePath("/profile/inventory");
}
