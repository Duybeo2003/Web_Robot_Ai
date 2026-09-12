"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

const inventorySchema = z.object({
  productId: z.string().min(1).max(191),
  variantId: z.string().min(1).max(191).nullish(),
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
        include: { variants: { select: { id: true } } },
      });
      if (!product) throw new Error("Sản phẩm không tồn tại.");
      const variant = data.variantId
        ? product.variants.find((candidate) => candidate.id === data.variantId)
        : null;
      if (product.variants.length > 0 && !variant) {
        throw new Error("Vui lòng chọn đúng phân loại cần nhập hoặc xuất kho.");
      }
      if (product.variants.length === 0 && data.variantId) {
        throw new Error("Sản phẩm này không có phân loại kho.");
      }

      if (data.type === "OUT") {
        const claimed = variant
          ? await tx.productVariant.updateMany({
              where: {
                id: variant.id,
                productId: product.id,
                inventoryCount: { gte: data.quantity },
              },
              data: { inventoryCount: { decrement: data.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: product.id, inventoryCount: { gte: data.quantity } },
              data: { inventoryCount: { decrement: data.quantity } },
            });
        if (claimed.count === 0) throw new Error("Số lượng tồn kho không đủ để xuất.");
      } else if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { inventoryCount: { increment: data.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: { inventoryCount: { increment: data.quantity } },
        });
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId: product.id,
          variantId: variant?.id,
          type: data.type,
          source: "MANUAL",
          quantity: data.quantity,
          costPrice: data.costPrice,
          reference: data.reference,
          note: data.note,
          userId: user.id,
        },
      });
      const updatedInventoryCount = variant
        ? (
            await tx.productVariant.findUniqueOrThrow({
              where: { id: variant.id },
              select: { inventoryCount: true },
            })
          ).inventoryCount
        : (
            await tx.product.findUniqueOrThrow({
              where: { id: product.id },
              select: { inventoryCount: true },
            })
          ).inventoryCount;
      return { transaction, updatedInventoryCount };
    });

    await recordAudit({
      actorId: user.id,
      action: `inventory.${data.type.toLowerCase()}`,
      model: "Product",
      recordId: data.productId,
      after: {
        quantity: data.quantity,
        inventoryCount: result.updatedInventoryCount,
        variantId: data.variantId || null,
        reference: data.reference || null,
      },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${data.productId}`);
    return { success: true, data: result };
  } catch (error) {
    logger.error("inventory.transaction_failed", { error });
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
      where: {
        deletedAt: null,
        OR: [
          {
            AND: [
              { variants: { none: {} } },
              { inventoryCount: { lte: safeThreshold } },
            ],
          },
          { variants: { some: { inventoryCount: { lte: safeThreshold } } } },
        ],
      },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        sku: true,
        inventoryCount: true,
        imageUrl: true,
        variants: {
          where: { inventoryCount: { lte: safeThreshold } },
          select: {
            id: true,
            sku: true,
            inventoryCount: true,
            attributes: true,
          },
          orderBy: { inventoryCount: "asc" },
        },
      },
    });
    type LowStockLocation = {
      id: string;
      productId: string;
      title: string;
      sku: string | null;
      imageUrl: string | null;
      inventoryCount: number;
      variantLabel: string | null;
    };
    const data = products.flatMap<LowStockLocation>((product) => {
      if (product.variants.length === 0) {
        return [
          {
            id: `${product.id}:base`,
            productId: product.id,
            title: product.title,
            sku: product.sku,
            imageUrl: product.imageUrl,
            inventoryCount: product.inventoryCount,
            variantLabel: null,
          },
        ];
      }
      return product.variants.map((variant) => ({
        id: `${product.id}:${variant.id}`,
        productId: product.id,
        title: product.title,
        sku: variant.sku || product.sku,
        imageUrl: product.imageUrl,
        inventoryCount: variant.inventoryCount,
        variantLabel:
          variant.attributes &&
          typeof variant.attributes === "object" &&
          !Array.isArray(variant.attributes)
            ? Object.values(variant.attributes)
                .filter(
                  (value): value is string | number =>
                    typeof value === "string" || typeof value === "number",
                )
                .join(" - ")
            : "Phân loại",
      }));
    });
    data.sort((left, right) => left.inventoryCount - right.inventoryCount);
    return { success: true, data };
  } catch {
    return { error: "Không thể tải danh sách sắp hết hàng." };
  }
}
