"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function toggleWishlist(input: string) {
  try {
    const user = await requireUser();
    const productId = z.string().min(1).max(191).parse(input);
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
    } else {
      const product = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
        select: { id: true },
      });
      if (!product) throw new Error("Sản phẩm không tồn tại.");
      await prisma.wishlist.create({ data: { userId: user.id, productId } });
    }
    revalidatePath("/shop");
    revalidatePath("/shop/[slug]", "page");
    revalidatePath("/profile/wishlist");
    return { success: true, isWished: !existing };
  } catch (error) {
    console.error("[WISHLIST_ERROR]", error);
    return { success: false, error: "Không thể cập nhật danh sách yêu thích." };
  }
}
