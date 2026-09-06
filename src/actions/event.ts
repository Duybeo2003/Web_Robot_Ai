"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function getActiveEvents() {
  return prisma.event.findMany({
    where: {
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { prizes: true }
      }
    }
  });
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      prizes: {
        orderBy: { probability: 'asc' }
      },
      _count: {
        select: { histories: true }
      }
    }
  });
}

export async function getRecentWinners(eventId: string) {
  return prisma.userEventHistory.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          image: true
        }
      }
    }
  });
}

export async function spinWheel(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Rate Limiting: Max 30 spins per minute per user
  const rl = await checkRateLimit(`rl:spin:${session.user.id}`, 30, 60);
  if (!rl.success) {
    throw new Error("Bạn thao tác quá nhanh. Vui lòng chậm lại.");
  }
  const userId = session.user.id;

  return prisma.$transaction(async (tx) => {
    // 1. Get Event and Wallet
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { prizes: true }
    });
    if (!event || !event.isActive) throw new Error("Sự kiện không tồn tại hoặc đã kết thúc");

    const wallet = await tx.userWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < event.pricePerPlay) {
      throw new Error("Không đủ số dư Xu. Vui lòng nạp thêm!");
    }

    // 2. Deduct Xu
    const walletUpdate = await tx.userWallet.updateMany({
      where: { id: wallet.id, balance: { gte: event.pricePerPlay } },
      data: { balance: { decrement: event.pricePerPlay } }
    });
    
    if (walletUpdate.count === 0) {
      throw new Error("Số dư không đủ trong quá trình giao dịch!");
    }

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: event.pricePerPlay,
        type: "SPEND",
        status: "COMPLETED",
        description: `Chơi vòng quay: ${event.name}`
      }
    });

    // 3. Roll the dice based on probability
    const prizes = event.prizes;
    const totalWeight = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let randomNum = Math.random() * totalWeight;
    
    let wonPrize = prizes[prizes.length - 1]; // Default to last
    for (const prize of prizes) {
      if (randomNum <= prize.probability) {
        // Check stock if it has limit
        if (prize.stock !== null) {
          if (prize.stock > 0) {
            wonPrize = prize;
            break;
          }
          // If out of stock, continue to next prize
        } else {
          wonPrize = prize;
          break;
        }
      }
      randomNum -= prize.probability;
    }

    // 4. Update Prize Stock
    if (wonPrize.stock !== null) {
      const updateStockResult = await tx.eventPrize.updateMany({
        where: { id: wonPrize.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } }
      });
      if (updateStockResult.count === 0) {
        throw new Error("Phần thưởng này vừa hết cách đây 1 giây. Vui lòng quay lại!");
      }
    }

    // 5. Add to User History
    await tx.userEventHistory.create({
      data: {
        userId,
        eventId,
        prizeName: wonPrize.name,
        cost: event.pricePerPlay
      }
    });

    // 6. Give Reward
    if (wonPrize.productId) {
      // Physical item -> Add to Inventory
      await tx.userInventory.create({
        data: {
          userId: userId,
          productId: wonPrize.productId,
          quantity: 1,
          isClaimed: false,
          status: "AVAILABLE",
          source: "EVENT_PRIZE",
          sellPriceXu: wonPrize.sellPriceXu
        }
      });
    } else if (wonPrize.rewardPoints > 0) {
      // Points reward -> Add directly to wallet or points
      await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: wonPrize.rewardPoints } }
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: wonPrize.rewardPoints,
          type: "REWARD",
          status: "COMPLETED",
          description: `Trúng thưởng: ${wonPrize.name}`
        }
      });
    }

    return wonPrize;
  });
}

export async function exchangePoints(eventId: string, prizeId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Rate Limiting: Max 10 exchanges per minute
  const rl = await checkRateLimit(`rl:exchange:${session.user.id}`, 10, 60);
  if (!rl.success) {
    throw new Error("Bạn thao tác quá nhanh. Vui lòng chậm lại.");
  }
  const userId = session.user.id;

  return prisma.$transaction(async (tx) => {
    // 1. Get Event, Prize and Wallet
    const event = await tx.event.findUnique({
      where: { id: eventId },
    });
    if (!event || !event.isActive) throw new Error("Sự kiện không tồn tại hoặc đã kết thúc");
    if (event.type !== "POINT_EXCHANGE") throw new Error("Loại sự kiện không hợp lệ");

    const prize = await tx.eventPrize.findUnique({
      where: { id: prizeId }
    });
    if (!prize || prize.eventId !== eventId) throw new Error("Vật phẩm không hợp lệ");

    const wallet = await tx.userWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < prize.pointCost) {
      throw new Error(`Bạn không đủ Xu để đổi vật phẩm này. Cần thêm ${prize.pointCost - (wallet?.balance || 0)} Xu!`);
    }

    if (prize.stock !== null && prize.stock <= 0) {
      throw new Error("Vật phẩm này đã hết hàng!");
    }

    // 2. Deduct Xu (with lock check)
    const walletUpdate = await tx.userWallet.updateMany({
      where: { id: wallet.id, balance: { gte: prize.pointCost } },
      data: { balance: { decrement: prize.pointCost } }
    });
    
    if (walletUpdate.count === 0) {
      throw new Error("Số dư không đủ trong quá trình giao dịch!");
    }

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: prize.pointCost,
        type: "SPEND",
        status: "COMPLETED",
        description: `Đổi vật phẩm: ${prize.name}`
      }
    });

    // 3. Update Prize Stock (with lock check)
    if (prize.stock !== null) {
      const updateStockResult = await tx.eventPrize.updateMany({
        where: { id: prize.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } }
      });
      if (updateStockResult.count === 0) {
        throw new Error("Phần thưởng này vừa bị đổi hết cách đây 1 giây. Vui lòng chọn món khác!");
      }
    }

    // 4. Add to User History
    await tx.userEventHistory.create({
      data: {
        userId,
        eventId,
        prizeName: prize.name,
        cost: prize.pointCost
      }
    });

    // 5. Give Reward
    if (prize.productId) {
      // Physical item -> Add to Inventory
      await tx.userInventory.create({
        data: {
          userId,
          productId: prize.productId,
          quantity: 1,
          isClaimed: false,
          status: "AVAILABLE",
          source: "EVENT_PRIZE",
          sellPriceXu: prize.sellPriceXu
        }
      });
    } else if (prize.rewardPoints > 0) {
      // It's weird to exchange points for points, but supported
      await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: prize.rewardPoints } }
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: prize.rewardPoints,
          type: "REWARD",
          status: "COMPLETED",
          description: `Nhận lại Xu: ${prize.name}`
        }
      });
    }

    return prize;
  });
}
