"use server";

import crypto from "crypto";
import type { EventPrize, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const idSchema = z.string().min(1).max(191);

export async function getActiveEvents() {
  const now = new Date();
  return prisma.event.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { prizes: true } } },
  });
}

export async function getEventBySlug(slug: string) {
  const now = new Date();
  return prisma.event.findFirst({
    where: {
      slug: z.string().min(1).max(191).parse(slug),
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      prizes: { orderBy: { probability: "asc" } },
      _count: { select: { histories: true } },
    },
  });
}

export async function getRecentWinners(eventId: string) {
  const now = new Date();
  return prisma.userEventHistory.findMany({
    where: {
      eventId: idSchema.parse(eventId),
      event: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, image: true } } },
  });
}

function choosePrize(prizes: EventPrize[]) {
  const eligible = prizes.filter(
    (prize) => prize.probability > 0 && (prize.stock === null || prize.stock > 0),
  );
  const totalWeight = eligible.reduce((sum, prize) => sum + prize.probability, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error("Sự kiện hiện không còn phần thưởng khả dụng.");
  }

  const scale = 1_000_000;
  let roll = crypto.randomInt(Math.max(1, Math.round(totalWeight * scale))) / scale;
  for (const prize of eligible) {
    if (roll < prize.probability) return prize;
    roll -= prize.probability;
  }
  return eligible[eligible.length - 1];
}

async function grantPrize(
  tx: Prisma.TransactionClient,
  userId: string,
  walletId: string,
  eventId: string,
  eventName: string,
  prize: EventPrize,
  cost: number,
) {
  if (prize.stock !== null) {
    const claimed = await tx.eventPrize.updateMany({
      where: { id: prize.id, stock: { gt: 0 } },
      data: { stock: { decrement: 1 } },
    });
    if (claimed.count === 0) throw new Error("Phần thưởng vừa hết. Vui lòng thử lại.");
  }

  await tx.userEventHistory.create({
    data: { userId, eventId, prizeName: prize.name, cost },
  });
  if (prize.productId) {
    await tx.userInventory.create({
      data: {
        userId,
        productId: prize.productId,
        quantity: 1,
        status: "AVAILABLE",
        source: "EVENT_PRIZE",
        sellPriceXu: prize.sellPriceXu,
      },
    });
  } else if (prize.rewardPoints > 0) {
    await tx.userWallet.update({
      where: { id: walletId },
      data: { balance: { increment: prize.rewardPoints } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId,
        amount: prize.rewardPoints,
        type: "REWARD",
        status: "COMPLETED",
        description: `Trúng thưởng ${eventName}: ${prize.name}`,
      },
    });
  }
}

export async function spinWheel(rawEventId: string) {
  const user = await requireUser();
  const eventId = idSchema.parse(rawEventId);
  const rateLimit = await checkRateLimit(`rl:spin:${user.id}`, 30, 60, {
    failClosed: true,
  });
  if (!rateLimit.success) throw new Error("Bạn thao tác quá nhanh. Vui lòng chậm lại.");

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const event = await tx.event.findFirst({
      where: { id: eventId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: { prizes: true },
    });
    if (!event || event.type !== "LUCKY_WHEEL") throw new Error("Sự kiện không khả dụng.");
    const prize = choosePrize(event.prizes);
    const wallet = await tx.userWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) throw new Error("Không tìm thấy ví Xu.");

    const charged = await tx.userWallet.updateMany({
      where: { id: wallet.id, balance: { gte: event.pricePerPlay } },
      data: { balance: { decrement: event.pricePerPlay } },
    });
    if (charged.count === 0) throw new Error("Số dư Xu không đủ.");
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: event.pricePerPlay,
        type: "SPEND",
        status: "COMPLETED",
        description: `Chơi vòng quay: ${event.name}`,
      },
    });
    await grantPrize(tx, user.id, wallet.id, event.id, event.name, prize, event.pricePerPlay);
    return prize;
  });
}

export async function exchangePoints(rawEventId: string, rawPrizeId: string) {
  const user = await requireUser();
  const eventId = idSchema.parse(rawEventId);
  const prizeId = idSchema.parse(rawPrizeId);
  const rateLimit = await checkRateLimit(`rl:exchange:${user.id}`, 10, 60, {
    failClosed: true,
  });
  if (!rateLimit.success) throw new Error("Bạn thao tác quá nhanh. Vui lòng chậm lại.");

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const event = await tx.event.findFirst({
      where: {
        id: eventId,
        type: "POINT_EXCHANGE",
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
    if (!event) throw new Error("Sự kiện không khả dụng.");
    const prize = await tx.eventPrize.findFirst({ where: { id: prizeId, eventId } });
    if (!prize) throw new Error("Phần thưởng không hợp lệ.");
    const wallet = await tx.userWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) throw new Error("Không tìm thấy ví Xu.");

    const charged = await tx.userWallet.updateMany({
      where: { id: wallet.id, balance: { gte: prize.pointCost } },
      data: { balance: { decrement: prize.pointCost } },
    });
    if (charged.count === 0) throw new Error("Số dư Xu không đủ.");
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: prize.pointCost,
        type: "SPEND",
        status: "COMPLETED",
        description: `Đổi vật phẩm: ${prize.name}`,
      },
    });
    await grantPrize(tx, user.id, wallet.id, event.id, event.name, prize, prize.pointCost);
    return prize;
  });
}
