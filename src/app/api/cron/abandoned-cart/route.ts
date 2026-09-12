import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendAbandonedCartEmail } from "@/lib/email";
import { ABANDONED_CART_HOURS } from "@/lib/commerce-policy";

export const dynamic = "force-dynamic";

const MAX_BATCH = 50;
const ITEMS_PER_EMAIL = 3;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDONED_CART_HOURS * 60 * 60 * 1000);

  try {
    // Carts updated more than ABANDONED_CART_HOURS ago (user added items but
    // didn't checkout) that haven't already gotten a nudge for this
    // abandonment episode — without this, an untouched cart matches on every
    // cron run forever.
    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: { lte: cutoff },
        abandonedEmailSentAt: null,
        items: { some: {} },
        user: { email: { not: null }, deletedAt: null },
      },
      select: {
        id: true,
        user: { select: { email: true, name: true } },
        _count: { select: { items: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { title: true, price: true } },
          },
          take: ITEMS_PER_EMAIL,
        },
      },
      orderBy: { updatedAt: "asc" },
      take: MAX_BATCH,
    });

    let sent = 0;
    for (const cart of carts) {
      if (!cart.user.email) continue;
      try {
        await sendAbandonedCartEmail(
          cart.user.email,
          cart.user.name,
          cart.id,
          cart.items.map((i) => ({
            title: i.product.title,
            price: Number(i.product.price),
            quantity: i.quantity,
          })),
          cart._count.items,
        );
        await prisma.cart.update({
          where: { id: cart.id },
          data: { abandonedEmailSentAt: new Date() },
        });
        sent++;
      } catch (e) {
        logger.error("cron.abandoned_cart.send_failed", { email: cart.user.email, error: e });
      }
    }

    return NextResponse.json({ inspected: carts.length, sent });
  } catch (e) {
    logger.error("cron.abandoned_cart.failed", { error: e });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
