"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { recordAudit } from "@/lib/audit";
import { isAllowedImageUrl, isAllowedVideoUrl } from "@/lib/media-url";

const idSchema = z.string().min(1).max(191);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );
const optionalHttpsUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().url().startsWith("https://").max(2_000).optional(),
);
const imageUrlSchema = z
  .string()
  .trim()
  .max(2_000)
  .refine(isAllowedImageUrl, "Ảnh phải là tệp tải lên hoặc URL từ nguồn ảnh được hỗ trợ.");
const optionalImageUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  imageUrlSchema.optional(),
);
const optionalVideoUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .trim()
    .max(2_000)
    .refine(isAllowedVideoUrl, "Video phải là tệp tải lên, YouTube hoặc TikTok hợp lệ.")
    .optional(),
);
const variantSchema = z.object({
  id: z.string().min(1).max(191).optional(),
  attributes: z.record(z.string(), z.string().max(100)),
  price: z.number().int().min(0).max(1_000_000_000),
  originalPrice: z.number().int().min(0).max(1_000_000_000).nullish(),
  inventoryCount: z.number().int().min(0).max(1_000_000),
  sku: optionalText(191),
  imageUrl: optionalImageUrl,
});

const productSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().min(10).max(100_000),
    price: z.number().int().min(0).max(1_000_000_000),
    type: z.enum(["ROBOT_STEM", "KIT_ARDUINO", "DO_CHOI_LOGIC"]),
    supplyType: z
      .enum(["IN_HOUSE", "AFFILIATE_SELL", "PRE_ORDER", "AFFILIATE_HOST"])
      .default("IN_HOUSE"),
    inventoryCount: z.number().int().min(0).max(1_000_000),
    sku: optionalText(191),
    imageUrl: z.union([z.literal(""), imageUrlSchema]),
    gallery: z.array(imageUrlSchema).max(30).optional(),
    videoUrl: optionalVideoUrl,
    originalPrice: z.number().int().min(0).max(1_000_000_000).nullish(),
    flashSaleActive: z.boolean().optional(),
    flashSaleEndDate: optionalDate,
    flashSaleStock: z.number().int().min(0).max(1_000_000).optional(),
    ageRange: z.enum(["AGE_3_5", "AGE_6_8", "AGE_9_12", "AGE_12_PLUS"]).nullish().or(z.literal("")),
    primarySkill: z.enum(["LOGIC", "LANGUAGE", "MOTOR_SKILLS", "EQ"]).nullish().or(z.literal("")),
    educationalGoal: optionalText(10_000),
    isCombo: z.boolean().optional(),
    externalAffiliateLink: optionalHttpsUrl,
    commissionRate: z.number().min(0).max(100).nullish(),
    depositPercent: z.number().int().min(1).max(100).nullish(),
    estimatedArrivalDate: optionalDate,
    categoryId: optionalText(191),
    comboItems: z
      .array(
        z.object({
          productId: z.string().min(1).max(191),
          quantity: z.number().int().min(1).max(99).optional(),
        }),
      )
      .max(100)
      .optional(),
    variants: z.array(variantSchema).max(100).optional(),
  })
  .superRefine((data, context) => {
    if (data.flashSaleActive && !data.flashSaleEndDate) {
      context.addIssue({ code: "custom", path: ["flashSaleEndDate"], message: "Flash Sale cần ngày kết thúc." });
    }
    if (data.supplyType === "PRE_ORDER" && !data.estimatedArrivalDate) {
      context.addIssue({ code: "custom", path: ["estimatedArrivalDate"], message: "Sản phẩm đặt trước cần ngày dự kiến về hàng." });
    }
    if (data.supplyType === "PRE_ORDER" && !data.depositPercent) {
      context.addIssue({ code: "custom", path: ["depositPercent"], message: "Sản phẩm đặt trước cần tỷ lệ tiền cọc." });
    }
    if (data.supplyType === "AFFILIATE_SELL" && !data.externalAffiliateLink) {
      context.addIssue({ code: "custom", path: ["externalAffiliateLink"], message: "Sản phẩm liên kết cần URL HTTPS." });
    }
    if (data.isCombo && (!data.comboItems || data.comboItems.length === 0)) {
      context.addIssue({ code: "custom", path: ["comboItems"], message: "Combo cần có ít nhất một sản phẩm thành phần." });
    }
    if (data.comboItems && new Set(data.comboItems.map((item) => item.productId)).size !== data.comboItems.length) {
      context.addIssue({ code: "custom", path: ["comboItems"], message: "Mỗi sản phẩm chỉ được xuất hiện một lần trong combo." });
    }
    if (data.originalPrice !== null && data.originalPrice !== undefined && data.originalPrice < data.price) {
      context.addIssue({ code: "custom", path: ["originalPrice"], message: "Giá niêm yết không được thấp hơn giá bán." });
    }
    const availableStock = data.variants?.length
      ? data.variants.reduce((total, variant) => total + variant.inventoryCount, 0)
      : data.inventoryCount;
    if (data.flashSaleActive && (data.flashSaleStock || 0) > availableStock) {
      context.addIssue({ code: "custom", path: ["flashSaleStock"], message: "Số suất Flash Sale không được vượt quá tồn kho khả dụng." });
    }
  });

export type ProductData = z.input<typeof productSchema>;

export function actionError(error: unknown, fallback: string) {
  console.error(`[ADMIN_ACTION_ERROR] ${fallback}`, error);
  if (error instanceof AuthorizationError) {
    return { success: false as const, error: "Bạn không có quyền thực hiện thao tác này." };
  }
  if (error instanceof z.ZodError) {
    return { success: false as const, error: error.issues[0]?.message || "Dữ liệu không hợp lệ." };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      success: false as const,
      error: error.code === "P2002" ? "Dữ liệu bị trùng với bản ghi hiện có." : fallback,
    };
  }
  if (error instanceof Prisma.PrismaClientValidationError || error instanceof Prisma.PrismaClientInitializationError) {
    return { success: false as const, error: fallback };
  }
  return { success: false as const, error: error instanceof Error ? error.message : fallback };
}

export async function upsertProduct(input: unknown, productId?: string) {
  try {
    const operator = await requireRole("ADMIN");
    const data = productSchema.parse(input);
    const id = productId ? idSchema.parse(productId) : undefined;
    let savedProductId = id;

    const baseData = {
      title: data.title,
      description: data.description,
      price: data.price,
      type: data.type,
      supplyType: data.supplyType,
      sku: data.sku || null,
      inventoryCount: data.inventoryCount,
      imageUrl: data.imageUrl || null,
      gallery: data.gallery || [],
      videoUrl: data.videoUrl || null,
      originalPrice: data.originalPrice || null,
      flashSaleActive: data.flashSaleActive || false,
      flashSaleEndDate: data.flashSaleActive ? data.flashSaleEndDate : null,
      flashSaleStock: data.flashSaleActive ? data.flashSaleStock || 0 : null,
      ageRange: data.ageRange || null,
      primarySkill: data.primarySkill || null,
      educationalGoal: data.educationalGoal || null,
      externalAffiliateLink: data.externalAffiliateLink || null,
      commissionRate: data.commissionRate ?? null,
      depositPercent: data.depositPercent ?? null,
      estimatedArrivalDate: data.estimatedArrivalDate || null,
      isCombo: data.isCombo || false,
      categoryId: data.categoryId || null,
    } satisfies Prisma.ProductUncheckedUpdateInput;

    await prisma.$transaction(async (tx) => {
      let savedId = savedProductId;
      if (savedId) {
        await tx.product.update({ where: { id: savedId }, data: baseData });
      } else {
        const baseSlug = generateSlug(data.title) || "san-pham";
        const created = await tx.product.create({
          data: { ...baseData, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` } as Prisma.ProductUncheckedCreateInput,
        });
        savedId = created.id;
        savedProductId = created.id;
      }

      if (data.isCombo) {
        const comboItems = data.comboItems || [];
        if (comboItems.some((item) => item.productId === savedId)) throw new Error("Combo không thể chứa chính nó.");
        const childCount = await tx.product.count({
          where: { id: { in: comboItems.map((item) => item.productId) }, isCombo: false, deletedAt: null },
        });
        if (childCount !== new Set(comboItems.map((item) => item.productId)).size) throw new Error("Combo chứa sản phẩm không hợp lệ.");
        await tx.comboItem.deleteMany({ where: { comboId: savedId } });
        if (comboItems.length) {
          await tx.comboItem.createMany({
            data: comboItems.map((item) => ({ comboId: savedId!, productId: item.productId, quantity: item.quantity || 1 })),
          });
        }
      } else {
        await tx.comboItem.deleteMany({ where: { comboId: savedId } });
      }

      const incomingVariants = data.variants || [];
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: savedId },
        select: { id: true, _count: { select: { orderItems: true } } },
      });
      const incomingIds = new Set(incomingVariants.flatMap((v) => (v.id ? [v.id] : [])));
      const blockedDeletion = existingVariants.find((v) => !incomingIds.has(v.id) && v._count.orderItems > 0);
      if (blockedDeletion) throw new Error("Không thể xóa phân loại đã xuất hiện trong đơn hàng. Hãy đặt tồn kho về 0.");
      await tx.productVariant.deleteMany({ where: { productId: savedId, id: { notIn: [...incomingIds] } } });
      for (const variant of incomingVariants) {
        const variantData = {
          attributes: variant.attributes,
          price: variant.price,
          originalPrice: variant.originalPrice || null,
          inventoryCount: variant.inventoryCount,
          sku: variant.sku || null,
          imageUrl: variant.imageUrl || null,
        };
        if (variant.id) {
          if (!existingVariants.some((v) => v.id === variant.id)) throw new Error("Phân loại sản phẩm không hợp lệ.");
          await tx.productVariant.update({ where: { id: variant.id }, data: variantData });
        } else {
          await tx.productVariant.create({ data: { ...variantData, productId: savedId } });
        }
      }
    });

    await recordAudit({
      actorId: operator.id,
      action: id ? "product.update" : "product.create",
      model: "Product",
      recordId: savedProductId,
      after: { title: data.title, price: data.price, supplyType: data.supplyType },
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin/combos");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/shop/[slug]", "page");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu sản phẩm.");
  }
}
