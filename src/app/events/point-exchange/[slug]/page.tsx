import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PointExchangeClientPage from "./client-page";
import { auth } from "@/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const event = await prisma.event.findUnique({
    where: { slug: resolvedParams.slug }
  });

  if (!event) return { title: "Không tìm thấy Sự kiện" };
  return { title: `${event.name} - Tích Điểm Đổi Quà` };
}

export default async function PointExchangeEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const event = await prisma.event.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      prizes: {
        orderBy: { pointCost: "asc" }
      }
    }
  });

  if (!event || event.type !== "POINT_EXCHANGE") {
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
