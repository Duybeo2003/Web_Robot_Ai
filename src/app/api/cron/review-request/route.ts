import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Orders completed between 7 and 8 days ago get a review request.
// Running this cron once daily ensures each order receives at most one email.
const REVIEW_DAYS = 7;
const MAX_BATCH = 50;

async function sendReviewRequestEmail(
  to: string,
  userName: string | null,
  orderId: string,
  productTitle: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return;

  const name = userName || "bạn";

  await fetch(process.env.EMAIL_API_URL?.trim() || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Bạn có hài lòng với ${productTitle}? ⭐`,
      html: `
<!DOCTYPE html><html lang="vi">
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h2 style="color:#ff5722;margin:0 0 16px;">🤖 RoboEQ — Đánh giá sản phẩm</h2>
    <p>Xin chào <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Đã 7 ngày kể từ khi bạn nhận được <strong>${productTitle}</strong> từ đơn hàng <strong>#${orderId.slice(0, 8).toUpperCase()}</strong>.</p>
    <p style="color:#555;line-height:1.6;">Bạn có hài lòng với sản phẩm không? Đánh giá của bạn giúp ích rất nhiều cho những người mua tiếp theo — chỉ mất 1 phút thôi!</p>
    <div style="margin-top:24px;text-align:center;">
      <a href="${appUrl}/profile/orders"
         style="display:inline-block;background:#ff5722;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
        Viết đánh giá ngay →
      </a>
    </div>
    <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">© ${new Date().getFullYear()} RoboEQ</p>
  </div>
</body></html>`,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() - REVIEW_DAYS * 24 * 60 * 60 * 1000);
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000);

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: windowStart, lte: windowEnd },
        user: { email: { not: null }, deletedAt: null },
      },
      select: {
        id: true,
        user: { select: { email: true, name: true } },
        items: {
          take: 1,
          select: { product: { select: { title: true } } },
        },
      },
      take: MAX_BATCH,
    });

    let sent = 0;
    for (const order of orders) {
      if (!order.user?.email) continue;
      const productTitle = order.items[0]?.product?.title || "sản phẩm";
      try {
        await sendReviewRequestEmail(order.user.email, order.user.name, order.id, productTitle);
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
