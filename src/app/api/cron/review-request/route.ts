import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendReviewRequestEmail } from "@/lib/email";
import { REVIEW_REQUEST_DELAY_DAYS } from "@/lib/commerce-policy";

export const dynamic = "force-dynamic";

const MAX_BATCH = 50;
// How far past the eligibility date we still look back for orders a
// previous, capacity-limited run hasn't gotten to yet. Bounded so a stale
// old order (e.g. from before this field existed) never suddenly emails.
const CATCH_UP_GRACE_DAYS = 30;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() - REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
  const windowStart = new Date(
    windowEnd.getTime() - CATCH_UP_GRACE_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        reviewRequestSentAt: null,
        completedAt: { gte: windowStart, lte: windowEnd },
        user: { email: { not: null }, deletedAt: null },
      },
      select: {
        id: true,
        user: { select: { email: true, name: true } },
        items: {
          take: 1,
          orderBy: { id: "asc" },
          select: { product: { select: { title: true } } },
        },
      },
      orderBy: { completedAt: "asc" },
      take: MAX_BATCH,
    });

    let sent = 0;
    for (const order of orders) {
      if (!order.user?.email) continue;
      const productTitle = order.items[0]?.product?.title || "sản phẩm";
      try {
        await sendReviewRequestEmail(order.user.email, order.user.name, order.id, productTitle);
        await prisma.order.update({
          where: { id: order.id },
          data: { reviewRequestSentAt: new Date() },
        });
        sent++;
      } catch (e) {
        logger.error("cron.review_request.send_failed", { orderId: order.id, error: e });
      }
    }

    return NextResponse.json({ inspected: orders.length, sent });
  } catch (e) {
    logger.error("cron.review_request.failed", { error: e });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
