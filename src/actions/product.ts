"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authz";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1).max(191);

export async function deleteProduct(rawId: string) {
  try {
    const operator = await requireRole("ADMIN");
    const id = idSchema.parse(rawId);
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { title: true },
    });
    if (!product) throw new Error("Không tìm thấy sản phẩm.");

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          inventoryCount: 0,
          flashSaleActive: false,
          flashSaleEndDate: null,
          flashSaleStock: null,
        },
      }),
    ]);
    await recordAudit({
      actorId: operator.id,
      action: "product.soft_delete",
      model: "Product",
      recordId: id,
      before: { title: product.title, deleted: false },
      after: { deleted: true },
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin/combos");
    revalidatePath("/shop");
    revalidatePath("/");
    return;
  } catch (error) {
    logger.error("product.delete_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return { success: false as const, error: "Không thể xóa sản phẩm." };
  }
}

export async function removeFlashSale(rawId: string) {
  try {
    const operator = await requireRole("ADMIN");
    const id = idSchema.parse(rawId);
    const updated = await prisma.product.updateMany({
      where: { id, deletedAt: null },
      data: {
        flashSaleActive: false,
        flashSaleEndDate: null,
        flashSaleStock: null,
      },
    });
    if (updated.count === 0) throw new Error("Không tìm thấy sản phẩm.");
    await recordAudit({
      actorId: operator.id,
      action: "product.flash_sale_removed",
      model: "Product",
      recordId: id,
      after: { flashSaleActive: false },
    });
    revalidatePath("/admin/flash-sales");
    revalidatePath("/admin/products");
    revalidatePath("/admin/combos");
    revalidatePath("/shop");
    revalidatePath("/");
    return;
  } catch (error) {
    logger.error("product.flash_sale_remove_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return;
  }
}
