"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { isAllowedImageUrl } from "@/lib/media-url";

const idSchema = z.string().min(1).max(191);
const optionalImageUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .trim()
    .max(2_000)
    .refine(isAllowedImageUrl, "Ảnh phải là tệp tải lên hoặc URL ảnh được hỗ trợ.")
    .optional(),
);
const uiConfigSchema = z
  .object({
    bgColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-f]{6}$/i, "Màu nền phải ở dạng #RRGGBB.")
      .optional(),
  })
  .strict()
  .nullish();
const eventSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(191),
    description: z.string().trim().max(20_000).nullish(),
    bannerUrl: optionalImageUrl,
    rules: z.string().trim().max(20_000).nullish(),
    uiConfig: uiConfigSchema,
    type: z.enum(["LUCKY_WHEEL", "MYSTERY_BOX", "POINT_EXCHANGE"]),
    pricePerPlay: z.number().int().min(0).max(1_000_000_000),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu.",
  });
const prizeSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    imageUrl: optionalImageUrl,
    probability: z.number().min(0).max(100),
    stock: z.number().int().min(0).max(1_000_000).nullable(),
    isJackpot: z.boolean(),
    rewardPoints: z.number().int().min(0).max(1_000_000_000),
    productId: z.string().min(1).max(191).nullable(),
    pointCost: z.number().int().min(0).max(1_000_000_000),
    sellPriceXu: z.number().int().min(0).max(1_000_000_000).nullable(),
  })
  .superRefine((data, context) => {
    if (data.productId && data.rewardPoints > 0) {
      context.addIssue({
        code: "custom",
        path: ["rewardPoints"],
        message: "Một ô chỉ được trao sản phẩm hoặc Xu.",
      });
    }
    if (!data.productId && data.sellPriceXu !== null) {
      context.addIssue({
        code: "custom",
        path: ["sellPriceXu"],
        message: "Chỉ quà sản phẩm mới có giá bán lại.",
      });
    }
    if (data.productId && (data.stock === null || data.stock <= 0)) {
      context.addIssue({
        code: "custom",
        path: ["stock"],
        message: "Quà sản phẩm cần giới hạn tồn kho lớn hơn 0.",
      });
    }
  });

async function assertEventReady(
  tx: Prisma.TransactionClient,
  eventId: string,
  type: "LUCKY_WHEEL" | "MYSTERY_BOX" | "POINT_EXCHANGE",
) {
  const prizes = await tx.eventPrize.findMany({
    where: { eventId },
    include: { product: { select: { deletedAt: true, supplyType: true } } },
  });
  if (prizes.length === 0) throw new Error("Hãy cấu hình phần thưởng trước khi kích hoạt sự kiện.");
  if (
    prizes.some(
      (prize) =>
        prize.productId &&
        (!prize.product ||
          prize.product.deletedAt !== null ||
          prize.product.supplyType === "AFFILIATE_SELL"),
    )
  ) {
    throw new Error("Sự kiện có sản phẩm thưởng không còn khả dụng để RoboEQ giao hàng.");
  }

  if (type === "LUCKY_WHEEL" || type === "MYSTERY_BOX") {
    const available = prizes.filter((prize) => prize.stock === null || prize.stock > 0);
    const totalProbability = available.reduce((sum, prize) => sum + prize.probability, 0);
    if (
      available.length === 0 ||
      available.some((prize) => prize.probability <= 0) ||
      Math.abs(totalProbability - 100) > 0.000_001
    ) {
      throw new Error("Tổng tỷ lệ của các ô còn hàng phải bằng đúng 100%.");
    }
  }

  if (
    type === "POINT_EXCHANGE" &&
    prizes.some(
      (prize) =>
        prize.pointCost <= 0 || (!prize.productId && prize.rewardPoints <= 0),
    )
  ) {
    throw new Error("Mỗi quà đổi điểm cần giá đổi lớn hơn 0 và một phần thưởng hợp lệ.");
  }
}

async function assertPrizeCanBeChanged(
  tx: Prisma.TransactionClient,
  eventId: string,
) {
  const event = await tx.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Không tìm thấy sự kiện.");
  if (event.isActive) throw new Error("Hãy tạm dừng sự kiện trước khi sửa phần thưởng.");
  return event;
}

async function assertPhysicalPrizeProduct(
  tx: Prisma.TransactionClient,
  productId: string | null,
) {
  if (!productId) return;
  const product = await tx.product.findFirst({
    where: { id: productId, deletedAt: null, supplyType: { not: "AFFILIATE_SELL" } },
    select: { id: true },
  });
  if (!product) throw new Error("Sản phẩm thưởng không tồn tại hoặc không do RoboEQ giao hàng.");
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  JSON.stringify(value);
  return value as Prisma.InputJsonValue;
}

export async function getAdminEvents() {
  await requireRole("ADMIN");
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { prizes: true, histories: true } } },
  });
}

export async function getAdminEventById(id: string) {
  await requireRole("ADMIN");
  return prisma.event.findUnique({
    where: { id: idSchema.parse(id) },
    include: { prizes: { orderBy: { probability: "asc" } } },
  });
}

export async function createEvent(input: unknown) {
  const operator = await requireRole("ADMIN");
  const data = eventSchema.parse(input);
  if (data.isActive) {
    throw new Error("Hãy tạo sự kiện ở trạng thái tạm dừng, cấu hình phần thưởng rồi mới kích hoạt.");
  }
  const event = await prisma.event.create({
    data: { ...data, uiConfig: jsonValue(data.uiConfig) },
  });
  await recordAudit({ actorId: operator.id, action: "event.create", model: "Event", recordId: event.id, after: { name: event.name, type: event.type } });
  revalidatePath("/admin/events");
  return event;
}

export async function updateEvent(id: string, input: unknown) {
  const operator = await requireRole("ADMIN");
  const data = eventSchema.parse(input);
  const eventId = idSchema.parse(id);
  const event = await prisma.$transaction(async (tx) => {
    const current = await tx.event.findUnique({ where: { id: eventId } });
    if (!current) throw new Error("Không tìm thấy sự kiện.");
    if (current.isActive && data.isActive) {
      throw new Error("Hãy tạm dừng sự kiện trước khi chỉnh sửa cấu hình.");
    }
    if (data.isActive) await assertEventReady(tx, eventId, data.type);
    return tx.event.update({
      where: { id: eventId },
      data: { ...data, uiConfig: jsonValue(data.uiConfig) },
    });
  });
  await recordAudit({ actorId: operator.id, action: "event.update", model: "Event", recordId: event.id, after: { name: event.name, type: event.type, isActive: event.isActive } });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${event.id}`);
  return event;
}

export async function deleteEvent(id: string) {
  const operator = await requireRole("ADMIN");
  const eventId = idSchema.parse(id);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { isActive: true, _count: { select: { histories: true } } },
  });
  if (!event) throw new Error("Không tìm thấy sự kiện.");
  if (event.isActive) throw new Error("Hãy tạm dừng sự kiện trước khi xóa.");
  if (event._count.histories > 0) {
    throw new Error("Sự kiện đã phát sinh giao dịch nên phải được lưu để đối soát.");
  }
  await prisma.event.delete({ where: { id: eventId } });
  await recordAudit({ actorId: operator.id, action: "event.delete", model: "Event", recordId: eventId });
  revalidatePath("/admin/events");
  return true;
}

export async function createPrize(eventId: string, input: unknown) {
  const operator = await requireRole("ADMIN");
  const data = prizeSchema.parse(input);
  eventId = idSchema.parse(eventId);
  const prize = await prisma.$transaction(async (tx) => {
    const event = await assertPrizeCanBeChanged(tx, eventId);
    await assertPhysicalPrizeProduct(tx, data.productId);
    if (event.type === "LUCKY_WHEEL" && data.probability <= 0) {
      throw new Error("Ô vòng quay cần tỷ lệ lớn hơn 0.");
    }
    if (
      event.type === "POINT_EXCHANGE" &&
      (data.pointCost <= 0 || (!data.productId && data.rewardPoints <= 0))
    ) {
      throw new Error("Quà đổi điểm cần giá đổi lớn hơn 0 và một phần thưởng hợp lệ.");
    }
    return tx.eventPrize.create({ data: { ...data, eventId } });
  });
  await recordAudit({ actorId: operator.id, action: "event_prize.create", model: "EventPrize", recordId: prize.id, after: { eventId: prize.eventId, name: prize.name } });
  revalidatePath(`/admin/events/${eventId}`);
  return prize;
}

export async function updatePrize(id: string, input: unknown) {
  const operator = await requireRole("ADMIN");
  const prizeId = idSchema.parse(id);
  const data = prizeSchema.parse(input);
  const prize = await prisma.$transaction(async (tx) => {
    const current = await tx.eventPrize.findUnique({ where: { id: prizeId } });
    if (!current) throw new Error("Không tìm thấy phần thưởng.");
    const event = await assertPrizeCanBeChanged(tx, current.eventId);
    await assertPhysicalPrizeProduct(tx, data.productId);
    if (event.type === "LUCKY_WHEEL" && data.probability <= 0) {
      throw new Error("Ô vòng quay cần tỷ lệ lớn hơn 0.");
    }
    if (
      event.type === "POINT_EXCHANGE" &&
      (data.pointCost <= 0 || (!data.productId && data.rewardPoints <= 0))
    ) {
      throw new Error("Quà đổi điểm cần giá đổi lớn hơn 0 và một phần thưởng hợp lệ.");
    }
    return tx.eventPrize.update({ where: { id: prizeId }, data });
  });
  await recordAudit({ actorId: operator.id, action: "event_prize.update", model: "EventPrize", recordId: prize.id, after: { eventId: prize.eventId, name: prize.name } });
  revalidatePath(`/admin/events/${prize.eventId}`);
  return prize;
}

export async function deletePrize(id: string) {
  const operator = await requireRole("ADMIN");
  const prizeId = idSchema.parse(id);
  const prize = await prisma.$transaction(async (tx) => {
    const current = await tx.eventPrize.findUnique({ where: { id: prizeId } });
    if (!current) throw new Error("Không tìm thấy phần thưởng.");
    await assertPrizeCanBeChanged(tx, current.eventId);
    return tx.eventPrize.delete({ where: { id: prizeId } });
  });
  await recordAudit({ actorId: operator.id, action: "event_prize.delete", model: "EventPrize", recordId: prize.id, before: { eventId: prize.eventId, name: prize.name } });
  revalidatePath(`/admin/events/${prize.eventId}`);
  return true;
}
