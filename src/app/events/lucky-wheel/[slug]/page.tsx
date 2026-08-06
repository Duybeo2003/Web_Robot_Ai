import { getEventBySlug, getRecentWinners } from "@/actions/event";
import { notFound } from "next/navigation";
import LuckyWheelClientPage from "./client-page";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function LuckyWheelPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const event = await getEventBySlug(resolvedParams.slug);

  if (!event || !event.isActive || event.type !== "LUCKY_WHEEL") {
    notFound();
  }

  const recentWinners = await getRecentWinners(event.id);
  
  // Get user balance
  const session = await auth();
  let userBalance = 0;
  if (session?.user?.id) {
    const wallet = await prisma.userWallet.findUnique({
      where: { userId: session.user.id }
    });
    if (wallet) {
      userBalance = wallet.balance;
    }
  }

  return (
    <LuckyWheelClientPage 
      event={event} 
      recentWinners={recentWinners} 
      userBalance={userBalance} 
      isLoggedIn={!!session?.user}
    />
  );
}
