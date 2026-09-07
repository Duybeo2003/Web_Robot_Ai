"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const inventorySchema = z.object({
  productId: z.string().min(1).max(191),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().min(1).max(1_000_000),
  costPrice: z.number().min(0).max(1_000_000_000).optional(),
  reference: z.string().trim().max(191).optional(),
  note: z.string().trim().max(1_000).optional(),
});

export async function createInventoryTransaction(input: unknown) {
  try {
    const user = await requireRole("ADMIN", "STORE_MANAGER");
    const data = inventorySchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: data.productId, deletedAt: null },
      });
      if (!product) throw new Error("Sản phẩm không tồn tại.");

      if (data.type === "OUT") {
        const claimed = await tx.product.updateMany({
          where: { id: product.id, inventoryCount: { gte: data.quantity } },
          data: { inventoryCount: { decrement: data.quantity } },
        });
        if (claimed.count === 0) throw new Error("Số lượng tồn kho không đủ để xuất.");
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: { inventoryCount: { increment: data.quantity } },
        });
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: data.type,
          quantity: data.quantity,
          costPrice: data.costPrice,
          reference: data.reference,
          note: data.note,
          userId: user.id,
        },
      });
      const updatedProduct = await tx.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      return { transaction, updatedProduct };
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${data.productId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error("[INVENTORY_ERROR]", error);
    return {
      error: error instanceof Error ? error.message : "Không thể cập nhật kho.",
    };
  }
}

export async function getLowStockProducts(threshold = 10) {
  try {
    await requireRole("ADMIN", "STORE_MANAGER");
    const safeThreshold = z.number().int().min(0).max(1_000_000).parse(threshold);
    const products = await prisma.product.findMany({
      where: { inventoryCount: { lte: safeThreshold }, deletedAt: null },
      orderBy: { inventoryCount: "asc" },
      select: {
        id: true,
        title: true,
        sku: true,
        inventoryCount: true,
        imageUrl: true,
      },
    });
    return { success: true, data: products };
  } catch {
    return { error: "Không thể tải danh sách sắp hết hàng." };
  }
}
