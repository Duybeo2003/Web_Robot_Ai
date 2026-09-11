"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { recordAudit } from "@/lib/audit";
import { actionError } from "@/actions/admin-products";

const idSchema = z.string().min(1).max(191);
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );
const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

// ─── Categories ───────────────────────────────────────────────────────────────

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
    await recordAudit({ actorId: operator.id, action: categoryId ? "category.update" : "category.create", model: "Category", recordId: savedId, after: data });
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
    await recordAudit({ actorId: operator.id, action: "category.delete", model: "Category", recordId: categoryId });
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa danh mục.");
  }
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

const couponSchema = z.object({
  code: z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
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
    await recordAudit({ actorId: operator.id, action: couponId ? "coupon.update" : "coupon.create", model: "Coupon", recordId: savedId, after: data });
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
    await recordAudit({ actorId: operator.id, action: "coupon.delete", model: "Coupon", recordId: couponId });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa mã giảm giá.");
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function deleteReview(id: string) {
  try {
    const operator = await requireRole("ADMIN");
    const reviewId = idSchema.parse(id);
    await prisma.review.delete({ where: { id: reviewId } });
    await recordAudit({ actorId: operator.id, action: "review.delete", model: "Review", recordId: reviewId });
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
    const current = await prisma.review.findUnique({ where: { id: reviewId }, select: { status: true } });
    if (!current) throw new Error("Không tìm thấy đánh giá.");
    if (current.status === status) return { success: true as const };
    await prisma.review.update({ where: { id: reviewId }, data: { status } });
    await recordAudit({ actorId: operator.id, action: "review.status_update", model: "Review", recordId: reviewId, before: { status: current.status }, after: { status } });
    revalidatePath("/admin/reviews");
    revalidatePath("/shop/[slug]", "page");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể cập nhật trạng thái đánh giá.");
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

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
    return { success: true as const, data: Object.fromEntries(settings.map((s) => [s.key, s.value])) };
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
    await recordAudit({ actorId: operator.id, action: "settings.update", model: "Setting", after: { keys: Object.keys(data) } });
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể lưu cài đặt.");
  }
}

// ─── Logistics ────────────────────────────────────────────────────────────────

export async function pushOrderToLogistics(orderId: string, provider: "GHN" | "GHTK") {
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
        recipient: { name: order.customerName, phone: order.receiverPhone, address: order.shippingAddress },
        items: order.items.map((item) => ({ sku: item.product.sku || item.productId, name: item.product.title, quantity: item.quantity })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Hãng vận chuyển từ chối yêu cầu (${response.status}).`);
    const result = z.object({ trackingCode: z.string().min(3).max(191) }).parse(await response.json());
    const updated = await prisma.order.updateMany({
      where: { id: order.id, status: "PROCESSING" },
      data: { status: "SHIPPED", logisticsProvider: provider, trackingCode: result.trackingCode, shippedAt: new Date() },
    });
    if (updated.count === 0) throw new Error("Đơn hàng đã thay đổi trạng thái.");
    await recordAudit({ actorId: operator.id, action: "order.shipment_created", model: "Order", recordId: order.id, before: { status: order.status }, after: { status: "SHIPPED", provider, trackingCode: result.trackingCode } });
    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true as const, trackingCode: result.trackingCode };
  } catch (error) {
    return actionError(error, "Không thể tạo vận đơn.");
  }
}
