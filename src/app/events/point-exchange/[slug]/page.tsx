import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PointExchangeClientPage from "./client-page";
import { auth } from "@/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const now = new Date();
  const event = await prisma.event.findFirst({
    where: {
      slug: resolvedParams.slug,
      type: "POINT_EXCHANGE",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  if (!event) return { title: "Không tìm thấy Sự kiện" };
  return { title: `${event.name} - Tích Điểm Đổi Quà` };
}

export default async function PointExchangeEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const now = new Date();
  const event = await prisma.event.findFirst({
    where: {
      slug: resolvedParams.slug,
      type: "POINT_EXCHANGE",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      prizes: {
        where: {
          OR: [
            { productId: null },
            { product: { deletedAt: null, supplyType: { not: "AFFILIATE_SELL" } } },
          ],
        },
        orderBy: { pointCost: "asc" }
      }
    }
  });

  if (!event || event.type !== "POINT_EXCHANGE") {
    notFound();
  }
  if (
    event.prizes.length === 0 ||
    event.prizes.some(
      (prize) => prize.pointCost <= 0 || (!prize.productId && prize.rewardPoints <= 0),
    )
  ) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  let walletBalance = 0;
  if (userId) {
    const wallet = await prisma.userWallet.findUnique({
      where: { userId }
    });
    walletBalance = wallet?.balance || 0;
  }

  return (
    <PointExchangeClientPage 
      event={event} 
      initialBalance={walletBalance} 
      userId={userId} 
    />
  );
}
