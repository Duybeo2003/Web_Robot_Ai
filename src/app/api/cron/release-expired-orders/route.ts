import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { cancelOrderAndRestoreInventory } from "@/lib/orders/cancel-order";
import { prisma } from "@/lib/prisma";
import { sendOrderCancelledEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      inventoryReservedUntil: { lte: new Date() },
    },
    select: { id: true, user: { select: { email: true } } },
    orderBy: { inventoryReservedUntil: "asc" },
    take: 100,
  });

  let released = 0;
  for (const order of expired) {
    const didRelease = await prisma.$transaction((tx) =>
      cancelOrderAndRestoreInventory(tx, order.id),
    );
    if (didRelease) {
      released += 1;
      if (order.user?.email) {
        sendOrderCancelledEmail(order.user.email, order.id).catch(() => null);
      }
    }
  }

  return NextResponse.json({ inspected: expired.length, released });
}
