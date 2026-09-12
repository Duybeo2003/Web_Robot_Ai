import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ABANDON_HOURS = 24;
const MAX_BATCH = 50;

// sendEmail is not exported — use the named helpers pattern from email.ts
// We access deliverEmail indirectly by building the payload inline via fetch to Resend
async function sendAbandonedCartEmail(
  to: string,
  userName: string | null,
  items: Array<{ title: string; imageUrl: string | null; price: number; quantity: number }>,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return;

  const name = userName || "bạn";
  const itemsHtml = items
    .slice(0, 3)
    .map(
      (item) =>
        `<li style="margin-bottom:8px;">${item.title} × ${item.quantity} — <strong>${item.price.toLocaleString("vi-VN")}đ</strong></li>`,
    )
    .join("");
  const moreText = items.length > 3 ? `<p style="color:#888;font-size:13px;">... và ${items.length - 3} sản phẩm khác</p>` : "";

  await fetch(process.env.EMAIL_API_URL?.trim() || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Bạn còn quên hàng trong giỏ! 🛒",
      html: `
<!DOCTYPE html><html lang="vi">
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h2 style="color:#ff5722;margin:0 0 16px;">🤖 RoboEQ — Giỏ hàng của bạn đang chờ</h2>
    <p style="color:#1a1a1a;line-height:1.6;">Xin chào <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Bạn đã để lại một số sản phẩm trong giỏ hàng. Đừng để chúng chờ lâu nhé!</p>
    <ul style="padding-left:20px;color:#333;">${itemsHtml}</ul>
    ${moreText}
    <div style="margin-top:24px;text-align:center;">
      <a href="${appUrl}/cart"
         style="display:inline-block;background:#ff5722;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
        Quay lại giỏ hàng →
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

  const cutoff = new Date(Date.now() - ABANDON_HOURS * 60 * 60 * 1000);

  try {
    // Carts updated more than ABANDON_HOURS ago (user added items but didn't checkout)
    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: { lte: cutoff },
        items: { some: {} },
        user: { email: { not: null }, deletedAt: null },
      },
      select: {
        user: { select: { email: true, name: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { title: true, imageUrl: true, price: true } },
          },
          take: 5,
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
          cart.items.map((i) => ({
            title: i.product.title,
            imageUrl: i.product.imageUrl,
            price: Number(i.product.price),
            quantity: i.quantity,
          })),
        );
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
