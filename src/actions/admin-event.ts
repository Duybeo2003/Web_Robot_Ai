"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1).max(191);
const eventSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(191),
    description: z.string().trim().max(20_000).nullish(),
    bannerUrl: z.string().trim().max(2_000).nullish(),
    rules: z.string().trim().max(20_000).nullish(),
    uiConfig: z.unknown().nullish(),
    type: z.enum(["LUCKY_WHEEL", "MYSTERY_BOX", "POINT_EXCHANGE"]),
    pricePerPlay: z.number().int().min(0).max(1_000_000_000),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu.",
  });
const prizeSchema = z.object({
  name: z.string().trim().min(1).max(160),
  imageUrl: z.string().trim().max(2_000).nullish(),
  probability: z.number().min(0).max(100),
  stock: z.number().int().min(0).max(1_000_000).nullable(),
  isJackpot: z.boolean(),
  rewardPoints: z.number().int().min(0).max(1_000_000_000),
  productId: z.string().min(1).max(191).nullable(),
  pointCost: z.number().int().min(0).max(1_000_000_000),
  sellPriceXu: z.number().int().min(0).max(1_000_000_000).nullable(),
});

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
  await requireRole("ADMIN");
  const data = eventSchema.parse(input);
  const event = await prisma.event.create({
    data: { ...data, uiConfig: jsonValue(data.uiConfig) },
  });
  revalidatePath("/admin/events");
  return event;
}

export async function updateEvent(id: string, input: unknown) {
  await requireRole("ADMIN");
  const data = eventSchema.parse(input);
  const event = await prisma.event.update({
    where: { id: idSchema.parse(id) },
    data: { ...data, uiConfig: jsonValue(data.uiConfig) },
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${event.id}`);
  return event;
}

export async function deleteEvent(id: string) {
  await requireRole("ADMIN");
  await prisma.event.delete({ where: { id: idSchema.parse(id) } });
  revalidatePath("/admin/events");
  return true;
}

export async function createPrize(eventId: string, input: unknown) {
  await requireRole("ADMIN");
  const data = prizeSchema.parse(input);
  const prize = await prisma.eventPrize.create({
    data: { ...data, eventId: idSchema.parse(eventId) },
  });
  revalidatePath(`/admin/events/${eventId}`);
  return prize;
}

export async function updatePrize(id: string, input: unknown) {
  await requireRole("ADMIN");
  const prize = await prisma.eventPrize.update({
    where: { id: idSchema.parse(id) },
    data: prizeSchema.parse(input),
  });
  revalidatePath(`/admin/events/${prize.eventId}`);
  return prize;
}

export async function deletePrize(id: string) {
  await requireRole("ADMIN");
  const prize = await prisma.eventPrize.delete({
    where: { id: idSchema.parse(id) },
  });
  revalidatePath(`/admin/events/${prize.eventId}`);
  return true;
}
