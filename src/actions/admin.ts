"use server";

import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { normalizeVietnamPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

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
const variantSchema = z.object({
  id: z.string().min(1).max(191).optional(),
  attributes: z.record(z.string(), z.string().max(100)),
  price: z.number().int().min(0).max(1_000_000_000),
  originalPrice: z.number().int().min(0).max(1_000_000_000).nullish(),
  inventoryCount: z.number().int().min(0).max(1_000_000),
  sku: optionalText(191),
  imageUrl: optionalText(2_000),
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
    imageUrl: z.string().trim().max(2_000),
    gallery: z.array(z.string().trim().max(2_000)).max(30).optional(),
    videoUrl: optionalHttpsUrl,
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
    if (data.supplyType === "AFFILIATE_SELL" && !data.externalAffiliateLink) {
      context.addIssue({ code: "custom", path: ["externalAffiliateLink"], message: "Sản phẩm liên kết cần URL HTTPS." });
    }
  });

export type ProductData = z.input<typeof productSchema>;

function actionError(error: unknown, fallback: string) {
  console.error(`[ADMIN_ACTION_ERROR] ${fallback}`, error);
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
}

export async function pushOrderToLogistics(
  orderId: string,
  provider: "GHN" | "GHTK",
) {
  try {
    await requireRole("ADMIN", "STORE_MANAGER");
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
    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true as const, trackingCode: result.trackingCode };
  } catch (error) {
    return actionError(error, "Không thể tạo vận đơn.");
  }
}

export async function upsertProduct(input: unknown, productId?: string) {
  try {
    await requireRole("ADMIN");
    const data = productSchema.parse(input);
    const id = productId ? idSchema.parse(productId) : undefined;
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
      let savedId = id;
      if (savedId) {
        await tx.product.update({ where: { id: savedId }, data: baseData });
      } else {
        const baseSlug = generateSlug(data.title) || "san-pham";
        const created = await tx.product.create({
          data: { ...baseData, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` } as Prisma.ProductUncheckedCreateInput,
        });
        savedId = created.id;
      }

      if (data.isCombo) {
        const comboItems = data.comboItems || [];
        if (comboItems.some((item) => item.productId === savedId)) {
          throw new Error("Combo không thể chứa chính nó.");
        }
        const childCount = await tx.product.count({
          where: { id: { in: comboItems.map((item) => item.productId) }, deletedAt: null },
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

export async function updateUserRole(userId: string, role: "USER" | "ADMIN" | "STORE_MANAGER") {
  try {
    const currentUser = await requireRole("ADMIN");
    const id = idSchema.parse(userId);
    const nextRole = z.enum(["USER", "ADMIN", "STORE_MANAGER"]).parse(role) as Role;
    if (currentUser.id === id) throw new Error("Bạn không thể tự thay đổi quyền của mình.");
    await prisma.user.update({ where: { id }, data: { role: nextRole } });
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
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN", deletedAt: null } });
      if (admins <= 1) throw new Error("Không thể xóa quản trị viên cuối cùng.");
    }
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa người dùng.");
  }
}

export async function upsertCategory(input: unknown, categoryId?: string) {
  try {
    await requireRole("ADMIN");
    const data = z.object({
      name: z.string().trim().min(2).max(120),
      description: optionalText(2_000),
    }).parse(input);
    if (categoryId) {
      await prisma.category.update({ where: { id: idSchema.parse(categoryId) }, data });
    } else {
      const baseSlug = generateSlug(data.name) || "danh-muc";
      await prisma.category.create({
        data: { ...data, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` },
      });
    }
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu danh mục.");
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireRole("ADMIN");
    const categoryId = idSchema.parse(id);
    const products = await prisma.product.count({ where: { categoryId } });
    if (products > 0) throw new Error("Danh mục đang chứa sản phẩm nên không thể xóa.");
    await prisma.category.delete({ where: { id: categoryId } });
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
    await requireRole("ADMIN");
    const data = couponSchema.parse(input);
    if (couponId) {
      await prisma.coupon.update({ where: { id: idSchema.parse(couponId) }, data });
    } else {
      await prisma.coupon.create({ data });
    }
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu mã giảm giá.");
  }
}

export async function deleteCoupon(id: string) {
  try {
    await requireRole("ADMIN");
    await prisma.coupon.delete({ where: { id: idSchema.parse(id) } });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa mã giảm giá.");
  }
}

export async function deleteReview(id: string) {
  try {
    await requireRole("ADMIN");
    await prisma.review.delete({ where: { id: idSchema.parse(id) } });
    revalidatePath("/admin/reviews");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa đánh giá.");
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
    await requireRole("ADMIN");
    const data = z.record(z.enum(SETTING_KEYS), z.string().trim().max(2_000)).parse(input);
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
      ),
    );
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu cài đặt.");
  }
}

export async function createAdminAccount(input: unknown) {
  try {
    await requireRole("ADMIN");
    const data = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      phoneNumber: z.string().transform((value, context) => {
        const phone = normalizeVietnamPhone(value);
        if (!phone) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
        return phone || "";
      }),
      password: z.string().min(12).max(128).optional(),
      role: z.enum(["ADMIN", "STORE_MANAGER"]),
    }).parse(input);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }] },
    });
    const password = data.password ? await bcrypt.hash(data.password, 12) : undefined;
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: data.name, role: data.role, password, deletedAt: null },
      });
    } else {
      if (!password) throw new Error("Mật khẩu tối thiểu 12 ký tự là bắt buộc.");
      await prisma.user.create({ data: { ...data, password } });
    }
    revalidatePath("/admin/admins");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể tạo tài khoản quản trị.");
  }
}
