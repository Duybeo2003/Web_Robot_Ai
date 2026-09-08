"use server";

import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { normalizeVietnamPhone } from "@/lib/phone";
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
      context.addIssue({
        code: "custom",
        path: ["comboItems"],
        message: "Combo cần có ít nhất một sản phẩm thành phần.",
      });
    }
    if (
      data.comboItems &&
      new Set(data.comboItems.map((item) => item.productId)).size !== data.comboItems.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["comboItems"],
        message: "Mỗi sản phẩm chỉ được xuất hiện một lần trong combo.",
      });
    }
    if (
      data.originalPrice !== null &&
      data.originalPrice !== undefined &&
      data.originalPrice < data.price
    ) {
      context.addIssue({
        code: "custom",
        path: ["originalPrice"],
        message: "Giá niêm yết không được thấp hơn giá bán.",
      });
    }
    const availableStock = data.variants?.length
      ? data.variants.reduce((total, variant) => total + variant.inventoryCount, 0)
      : data.inventoryCount;
    if (data.flashSaleActive && (data.flashSaleStock || 0) > availableStock) {
      context.addIssue({
        code: "custom",
        path: ["flashSaleStock"],
        message: "Số suất Flash Sale không được vượt quá tồn kho khả dụng.",
      });
    }
  });

export type ProductData = z.input<typeof productSchema>;

function actionError(error: unknown, fallback: string) {
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
  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return { success: false as const, error: fallback };
  }
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
}

async function lockActiveAdministrators(tx: Prisma.TransactionClient) {
  return tx.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT \`id\` FROM \`User\` WHERE \`role\` = 'ADMIN' AND \`deletedAt\` IS NULL ORDER BY \`id\` FOR UPDATE`,
  );
}

export async function pushOrderToLogistics(
  orderId: string,
  provider: "GHN" | "GHTK",
) {
  try {
    const operator = await requireRole("ADMIN", "STORE_MANAGER");
    const id = idSchema.parse(orderId);
    const endpoint = process.env.LOGISTICS_API_URL;
    const apiKey = process.env.LOGISTICS_API_KEY;
    if (!endpoint || !apiKey) throw new Error("Dịch vụ giao vận chưa được cấu hình.");
    if (process.env.NODE_ENV === "production" && !endpoint.startsWith("https://")) {
      throw new Error("LOGISTICS_API_URL phải sử dụng HTTPS.");
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { title: true, sku: true } } } } },
    });
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.status !== "PROCESSING") throw new Error("Chỉ có thể gửi đơn đang chuẩn bị.");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        idempotencyKey: `shipment:${order.id}:${provider}`,
        provider,
        orderId: order.id,
        recipient: {
          name: order.customerName,
          phone: order.receiverPhone,
          address: order.shippingAddress,
        },
        items: order.items.map((item) => ({
          sku: item.product.sku || item.productId,
          name: item.product.title,
          quantity: item.quantity,
        })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Hãng vận chuyển từ chối yêu cầu (${response.status}).`);
    const result = z.object({ trackingCode: z.string().min(3).max(191) }).parse(await response.json());

    const updated = await prisma.order.updateMany({
      where: { id: order.id, status: "PROCESSING" },
      data: {
        status: "SHIPPED",
        logisticsProvider: provider,
        trackingCode: result.trackingCode,
        shippedAt: new Date(),
      },
    });
    if (updated.count === 0) throw new Error("Đơn hàng đã thay đổi trạng thái.");
    await recordAudit({
      actorId: operator.id,
      action: "order.shipment_created",
      model: "Order",
      recordId: order.id,
      before: { status: order.status },
      after: { status: "SHIPPED", provider, trackingCode: result.trackingCode },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true as const, trackingCode: result.trackingCode };
  } catch (error) {
    return actionError(error, "Không thể tạo vận đơn.");
  }
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
        if (comboItems.some((item) => item.productId === savedId)) {
          throw new Error("Combo không thể chứa chính nó.");
        }
        const childCount = await tx.product.count({
          where: {
            id: { in: comboItems.map((item) => item.productId) },
            isCombo: false,
            deletedAt: null,
          },
        });
        if (childCount !== new Set(comboItems.map((item) => item.productId)).size) {
          throw new Error("Combo chứa sản phẩm không hợp lệ.");
        }
        await tx.comboItem.deleteMany({ where: { comboId: savedId } });
        if (comboItems.length) {
          await tx.comboItem.createMany({
            data: comboItems.map((item) => ({
              comboId: savedId!,
              productId: item.productId,
              quantity: item.quantity || 1,
            })),
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
      const incomingIds = new Set(incomingVariants.flatMap((variant) => (variant.id ? [variant.id] : [])));
      const blockedDeletion = existingVariants.find(
        (variant) => !incomingIds.has(variant.id) && variant._count.orderItems > 0,
      );
      if (blockedDeletion) {
        throw new Error("Không thể xóa phân loại đã xuất hiện trong đơn hàng. Hãy đặt tồn kho về 0.");
      }
      await tx.productVariant.deleteMany({
        where: {
          productId: savedId,
          id: { notIn: [...incomingIds] },
        },
      });
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
          if (!existingVariants.some((current) => current.id === variant.id)) {
            throw new Error("Phân loại sản phẩm không hợp lệ.");
          }
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

export async function updateUserRole(
  userId: string,
  role: "USER" | "ADMIN" | "STORE_MANAGER" | "EDITOR",
) {
  try {
    const currentUser = await requireRole("ADMIN");
    const id = idSchema.parse(userId);
    const nextRole = z.enum(["USER", "ADMIN", "STORE_MANAGER", "EDITOR"]).parse(role) as Role;
    if (currentUser.id === id) throw new Error("Bạn không thể tự thay đổi quyền của mình.");
    const target = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findFirst({
        where: { id, deletedAt: null },
        select: { role: true },
      });
      if (!current) throw new Error("Không tìm thấy người dùng.");
      if (current.role === "ADMIN" && nextRole !== "ADMIN") {
        const administrators = await lockActiveAdministrators(tx);
        if (administrators.length <= 1) {
          throw new Error("Không thể hạ quyền quản trị viên cuối cùng.");
        }
      }
      const updated = await tx.user.updateMany({
        where: { id, deletedAt: null, role: current.role },
        data: { role: nextRole },
      });
      if (updated.count === 0) throw new Error("Quyền người dùng vừa được thay đổi ở phiên khác.");
      return current;
    });
    await recordAudit({
      actorId: currentUser.id,
      action: "user.role_update",
      model: "User",
      recordId: id,
      before: { role: target.role },
      after: { role: nextRole },
    });
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể cập nhật quyền.");
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await requireRole("ADMIN");
    const id = idSchema.parse(userId);
    if (currentUser.id === id) throw new Error("Bạn không thể tự xóa tài khoản của mình.");
    const target = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findFirst({
        where: { id, deletedAt: null },
        select: { role: true },
      });
      if (!current) throw new Error("Không tìm thấy người dùng.");
      if (current.role === "ADMIN") {
        const administrators = await lockActiveAdministrators(tx);
        if (administrators.length <= 1) {
          throw new Error("Không thể xóa quản trị viên cuối cùng.");
        }
      }
      const deleted = await tx.user.updateMany({
        where: { id, deletedAt: null, role: current.role },
        data: { deletedAt: new Date() },
      });
      if (deleted.count === 0) throw new Error("Tài khoản vừa được thay đổi ở phiên khác.");
      return current;
    });
    await recordAudit({
      actorId: currentUser.id,
      action: "user.soft_delete",
      model: "User",
      recordId: id,
      before: { role: target?.role || "UNKNOWN", deleted: false },
      after: { deleted: true },
    });
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa người dùng.");
  }
}

export async function upsertCategory(input: unknown, categoryId?: string) {
  try {
    const operator = await requireRole("ADMIN");
    const data = z.object({
      name: z.string().trim().min(2).max(120),
      description: optionalText(2_000),
    }).parse(input);
    let savedId: string;
    if (categoryId) {
      savedId = idSchema.parse(categoryId);
      await prisma.category.update({ where: { id: savedId }, data });
    } else {
      const baseSlug = generateSlug(data.name) || "danh-muc";
      const created = await prisma.category.create({
        data: { ...data, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` },
      });
      savedId = created.id;
    }
    await recordAudit({
      actorId: operator.id,
      action: categoryId ? "category.update" : "category.create",
      model: "Category",
      recordId: savedId,
      after: data,
    });
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu danh mục.");
  }
}

export async function deleteCategory(id: string) {
  try {
    const operator = await requireRole("ADMIN");
    const categoryId = idSchema.parse(id);
    const products = await prisma.product.count({ where: { categoryId } });
    if (products > 0) throw new Error("Danh mục đang chứa sản phẩm nên không thể xóa.");
    await prisma.category.delete({ where: { id: categoryId } });
    await recordAudit({
      actorId: operator.id,
      action: "category.delete",
      model: "Category",
      recordId: categoryId,
    });
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa danh mục.");
  }
}

const couponSchema = z.object({
  code: z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  discountPercent: z.number().int().min(1).max(100),
  usageLimit: z.number().int().min(1).max(10_000_000).nullish(),
  expiresAt: optionalDate,
});

export async function upsertCoupon(input: unknown, couponId?: string) {
  try {
    const operator = await requireRole("ADMIN");
    const data = couponSchema.parse(input);
    let savedId: string;
    if (couponId) {
      savedId = idSchema.parse(couponId);
      await prisma.coupon.update({ where: { id: savedId }, data });
    } else {
      const created = await prisma.coupon.create({ data });
      savedId = created.id;
    }
    await recordAudit({
      actorId: operator.id,
      action: couponId ? "coupon.update" : "coupon.create",
      model: "Coupon",
      recordId: savedId,
      after: data,
    });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu mã giảm giá.");
  }
}

export async function deleteCoupon(id: string) {
  try {
    const operator = await requireRole("ADMIN");
    const couponId = idSchema.parse(id);
    await prisma.coupon.delete({ where: { id: couponId } });
    await recordAudit({
      actorId: operator.id,
      action: "coupon.delete",
      model: "Coupon",
      recordId: couponId,
    });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa mã giảm giá.");
  }
}

export async function deleteReview(id: string) {
  try {
    const operator = await requireRole("ADMIN");
    const reviewId = idSchema.parse(id);
    await prisma.review.delete({ where: { id: reviewId } });
    await recordAudit({
      actorId: operator.id,
      action: "review.delete",
      model: "Review",
      recordId: reviewId,
    });
    revalidatePath("/admin/reviews");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa đánh giá.");
  }
}

export async function updateReviewStatus(id: string, rawStatus: unknown) {
  try {
    const operator = await requireRole("ADMIN");
    const reviewId = idSchema.parse(id);
    const status = z.enum(["PENDING", "APPROVED", "REJECTED"]).parse(rawStatus);
    const current = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { status: true },
    });
    if (!current) throw new Error("Không tìm thấy đánh giá.");
    if (current.status === status) return { success: true as const };

    await prisma.review.update({ where: { id: reviewId }, data: { status } });
    await recordAudit({
      actorId: operator.id,
      action: "review.status_update",
      model: "Review",
      recordId: reviewId,
      before: { status: current.status },
      after: { status },
    });
    revalidatePath("/admin/reviews");
    revalidatePath("/shop/[slug]", "page");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể cập nhật trạng thái đánh giá.");
  }
}

const SETTING_KEYS = [
  "store_name",
  "hotline",
  "contact_email",
  "store_address",
  "facebook_url",
  "zalo_url",
  "marquee_text",
] as const;

export async function getSettings() {
  try {
    const settings = await prisma.setting.findMany({ where: { key: { in: [...SETTING_KEYS] } } });
    return {
      success: true as const,
      data: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
    };
  } catch (error) {
    return actionError(error, "Không thể tải cài đặt.");
  }
}

export async function updateSettings(input: unknown) {
  try {
    const operator = await requireRole("ADMIN");
    const data = z.record(z.enum(SETTING_KEYS), z.string().trim().max(2_000)).parse(input);
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
      ),
    );
    await recordAudit({
      actorId: operator.id,
      action: "settings.update",
      model: "Setting",
      after: { keys: Object.keys(data) },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu cài đặt.");
  }
}

export async function createAdminAccount(input: unknown) {
  try {
    const operator = await requireRole("ADMIN");
    const data = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      phoneNumber: z.string().transform((value, context) => {
        const phone = normalizeVietnamPhone(value);
        if (!phone) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
        return phone || "";
      }),
      password: z.string().min(12).max(128).optional(),
      role: z.enum(["ADMIN", "STORE_MANAGER", "EDITOR"]),
    }).parse(input);

    const matches = await prisma.user.findMany({
      where: { OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }] },
      take: 2,
    });
    if (matches.length > 1) {
      throw new Error("Email và số điện thoại đang thuộc hai tài khoản khác nhau.");
    }
    const existing = matches[0];
    if (
      existing &&
      (existing.email?.toLowerCase() !== data.email ||
        existing.phoneNumber !== data.phoneNumber)
    ) {
      throw new Error("Email hoặc số điện thoại đã được một tài khoản khác sử dụng.");
    }
    if (existing?.id === operator.id) {
      throw new Error("Hãy dùng luồng hồ sơ riêng để cập nhật tài khoản của bạn.");
    }
    const password = data.password ? await bcrypt.hash(data.password, 12) : undefined;
    let accountId: string;
    if (existing) {
      await prisma.$transaction(async (tx) => {
        if (existing.deletedAt === null && existing.role === "ADMIN" && data.role !== "ADMIN") {
          const administrators = await lockActiveAdministrators(tx);
          if (administrators.length <= 1) {
            throw new Error("Không thể hạ quyền quản trị viên cuối cùng.");
          }
        }
        await tx.user.update({
          where: { id: existing.id },
          data: { name: data.name, role: data.role, password, deletedAt: null },
        });
      });
      accountId = existing.id;
    } else {
      if (!password) throw new Error("Mật khẩu tối thiểu 12 ký tự là bắt buộc.");
      const created = await prisma.user.create({ data: { ...data, password } });
      accountId = created.id;
    }
    await recordAudit({
      actorId: operator.id,
      action: existing ? "staff.reactivate_or_update" : "staff.create",
      model: "User",
      recordId: accountId,
      after: { role: data.role, email: data.email },
    });
    revalidatePath("/admin/admins");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể tạo tài khoản quản trị.");
  }
}
