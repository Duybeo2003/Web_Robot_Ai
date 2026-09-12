import "server-only";

import { logger } from "@/lib/logger";

type OrderEmailItem = {
  quantity: number;
  priceAtPurchase: number | string;
  product?: { title?: string };
};

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailConfig() {
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return {
    apiKey,
    from,
    apiUrl: process.env.EMAIL_API_URL?.trim() || "https://api.resend.com/emails",
  };
}

async function deliverEmail(kind: string, recordId: string, payload: EmailPayload) {
  const config = emailConfig();
  if (!config) {
    logger.warn("email.skipped", { kind, recordId, reason: "email_api_not_configured" });
    return { success: false as const, skipped: true as const };
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Email API returned HTTP ${response.status}`);

    const result = (await response.json().catch(() => null)) as { id?: string } | null;
    logger.info("email.sent", { kind, recordId, messageId: result?.id });
    return { success: true as const };
  } catch (error) {
    logger.error("email.failed", {
      kind,
      recordId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { success: false as const };
  }
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
}

export async function sendOrderConfirmationEmail(
  userEmail: string,
  orderId: string,
  totalAmount: number,
  items: OrderEmailItem[] = [],
) {
  const itemsListHtml = items
    .map((item) => {
      const title = escapeHtml(item.product?.title || "Sản phẩm");
      return `<li>${title} × ${item.quantity} — ${Number(item.priceAtPurchase).toLocaleString("vi-VN")}đ</li>`;
    })
    .join("");

  return deliverEmail("order_confirmation", orderId, {
    to: userEmail,
    subject: `Xác nhận đơn hàng #${orderId} từ RoboEQ`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#ff5722">Cảm ơn bạn đã đặt hàng tại RoboEQ!</h2>
        <p>Đơn hàng <strong>#${escapeHtml(orderId)}</strong> đã được ghi nhận và đang được xử lý.</p>
        ${itemsListHtml ? `<h3>Chi tiết đơn hàng</h3><ul>${itemsListHtml}</ul>` : ""}
        <p><strong>Tổng cộng:</strong> <span style="color:#ff5722;font-size:18px;font-weight:bold">${totalAmount.toLocaleString("vi-VN")}đ</span></p>
        <p>Bạn có thể theo dõi đơn hàng tại <a href="${appUrl()}/profile/orders">trang đơn hàng</a>.</p>
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}

export async function sendAdminNewOrderNotification(orderId: string, totalAmount: number) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    logger.warn("email.skipped", {
      kind: "admin_new_order",
      orderId,
      reason: "admin_email_not_configured",
    });
    return { success: false as const, skipped: true as const };
  }

  return deliverEmail("admin_new_order", orderId, {
    to: adminEmail,
    subject: `[Thông báo] Có đơn hàng mới #${orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2 style="color:#2e7d32">Có đơn đặt hàng mới</h2>
        <p>Đơn hàng <strong>#${escapeHtml(orderId)}</strong> có tổng giá trị <strong>${totalAmount.toLocaleString("vi-VN")}đ</strong>.</p>
        <p><a href="${appUrl()}/admin/orders">Mở trang quản trị đơn hàng</a></p>
      </div>`,
  });
}

export async function sendOrderShippedEmail(
  userEmail: string,
  orderId: string,
  trackingCode?: string | null,
  provider?: string | null,
) {
  return deliverEmail("order_shipped", orderId, {
    to: userEmail,
    subject: `Đơn hàng #${orderId} đang được giao đến bạn`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#ff5722">🚚 Đơn hàng đang trên đường đến bạn!</h2>
        <p>Đơn hàng <strong>#${escapeHtml(orderId)}</strong> đã được bàn giao cho đơn vị vận chuyển${provider ? ` <strong>${escapeHtml(provider)}</strong>` : ""} và đang trên đường giao đến địa chỉ của bạn.</p>
        ${trackingCode ? `<p><strong>Mã vận đơn:</strong> <code style="background:#f5f5f5;padding:2px 6px;border-radius:4px">${escapeHtml(trackingCode)}</code></p>` : ""}
        <p>Bạn có thể theo dõi tình trạng tại <a href="${appUrl()}/profile/orders">trang đơn hàng</a>.</p>
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}

export async function sendOrderCompletedEmail(
  userEmail: string,
  orderId: string,
  pointsEarned?: number,
) {
  return deliverEmail("order_completed", orderId, {
    to: userEmail,
    subject: `Đơn hàng #${orderId} đã giao thành công ✅`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2e7d32">✅ Giao hàng thành công!</h2>
        <p>Đơn hàng <strong>#${escapeHtml(orderId)}</strong> đã được giao thành công. Cảm ơn bạn đã mua sắm tại RoboEQ!</p>
        ${pointsEarned && pointsEarned > 0 ? `<p>🎁 Bạn đã nhận được <strong style="color:#ff5722">${pointsEarned.toLocaleString("vi-VN")} điểm tích lũy</strong> từ đơn hàng này.</p>` : ""}
        <p>Hãy chia sẻ cảm nhận của bạn để giúp những khách hàng khác nhé! <a href="${appUrl()}/profile/orders">Đánh giá sản phẩm</a></p>
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}

export async function sendRmaStatusEmail(
  userEmail: string,
  rmaId: string,
  status: "APPROVED" | "REJECTED",
  reason?: string | null,
) {
  const isApproved = status === "APPROVED";
  return deliverEmail("rma_status_update", rmaId, {
    to: userEmail,
    subject: `Yêu cầu đổi/trả #${rmaId} ${isApproved ? "đã được duyệt" : "bị từ chối"}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:${isApproved ? "#2e7d32" : "#c62828"}">${isApproved ? "✅ Yêu cầu đổi/trả được duyệt" : "❌ Yêu cầu đổi/trả bị từ chối"}</h2>
        <p>Yêu cầu đổi/trả hàng <strong>#${escapeHtml(rmaId)}</strong> của bạn đã được xem xét.</p>
        ${reason ? `<p><strong>${isApproved ? "Ghi chú" : "Lý do từ chối"}:</strong> ${escapeHtml(reason)}</p>` : ""}
        ${isApproved ? `<p>Vui lòng gửi hàng về địa chỉ kho của chúng tôi. Chúng tôi sẽ liên hệ hướng dẫn thêm qua số điện thoại đã đăng ký.</p>` : `<p>Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ tại <a href="${appUrl()}/lien-he">trang liên hệ</a>.</p>`}
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}

export async function sendWelcomeEmail(user: {
  email?: string | null;
  name?: string | null;
}) {
  if (!user.email) return;
  const name = escapeHtml(user.name || "bạn");
  const url = appUrl();
  return deliverEmail("welcome", user.email, {
    to: user.email,
    subject: "Chào mừng bạn đến với RoboEQ! 🤖",
    html: `
<!DOCTYPE html><html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#ff5722;padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">🤖 RoboEQ</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Robot Giáo dục &amp; STEM</p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 12px;">Chào mừng ${name}!</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 24px;">Cảm ơn bạn đã tham gia cộng đồng RoboEQ — nơi cung cấp robot giáo dục, kit STEM và đồ chơi tư duy logic chất lượng cao cho trẻ em Việt Nam.</p>
      <div style="background:#fff8f5;border:1px solid #ffe5d9;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#ff5722;margin:0 0 8px;font-size:16px;">🎁 Ưu đãi thành viên mới</h3>
        <p style="color:#555;margin:0;line-height:1.6;">Khám phá các sản phẩm nổi bật và nhận ưu đãi đặc biệt trong lần mua đầu tiên!</p>
      </div>
      <div style="text-align:center;">
        <a href="${url}/shop" style="display:inline-block;background:#ff5722;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Khám phá sản phẩm ngay →</a>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} RoboEQ | <a href="${url}" style="color:#ff5722;text-decoration:none;">roboeq.vn</a></p>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendOrderCancelledEmail(userEmail: string, orderId: string) {
  return deliverEmail("order_cancelled", orderId, {
    to: userEmail,
    subject: `Đơn hàng #${orderId} đã được hủy`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#c62828">❌ Đơn hàng đã bị hủy</h2>
        <p>Đơn hàng <strong>#${escapeHtml(orderId)}</strong> của bạn đã được hủy thành công.</p>
        <p>Nếu bạn thanh toán trước, số tiền sẽ được hoàn trả theo chính sách của chúng tôi.</p>
        <p>Nếu có thắc mắc, vui lòng liên hệ hỗ trợ tại <a href="${appUrl()}/lien-he">trang liên hệ</a>.</p>
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}

export async function sendSupportRequestNotification(request: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    logger.warn("email.skipped", {
      kind: "support_request",
      requestId: request.id,
      reason: "admin_email_not_configured",
    });
    return { success: false as const, skipped: true as const };
  }

  return deliverEmail("support_request", request.id, {
    to: adminEmail,
    replyTo: request.email || undefined,
    subject: `[Hỗ trợ] Yêu cầu mới #${request.id}`,
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Yêu cầu hỗ trợ mới</h2>
        <p><strong>Khách hàng:</strong> ${escapeHtml(request.name)}</p>
        <p><strong>Điện thoại:</strong> ${escapeHtml(request.phone)}</p>
        ${request.email ? `<p><strong>Email:</strong> ${escapeHtml(request.email)}</p>` : ""}
        <p><strong>Nội dung:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(request.message)}</p>
        <p><a href="${appUrl()}/admin/support">Mở hàng đợi hỗ trợ</a></p>
      </div>`,
  });
}

export async function sendAbandonedCartEmail(
  userEmail: string,
  userName: string | null,
  cartId: string,
  items: Array<{ title: string; price: number; quantity: number }>,
  totalItemCount: number,
) {
  const name = escapeHtml(userName || "bạn");
  const itemsHtml = items
    .map(
      (item) =>
        `<li style="margin-bottom:8px;">${escapeHtml(item.title)} × ${item.quantity} — <strong>${item.price.toLocaleString("vi-VN")}đ</strong></li>`,
    )
    .join("");
  const remaining = totalItemCount - items.length;
  const moreText =
    remaining > 0
      ? `<p style="color:#888;font-size:13px;">... và ${remaining} sản phẩm khác</p>`
      : "";

  return deliverEmail("abandoned_cart", cartId, {
    to: userEmail,
    subject: "Bạn còn quên hàng trong giỏ! 🛒",
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <h2 style="color:#ff5722;margin:0 0 16px;">🤖 RoboEQ — Giỏ hàng của bạn đang chờ</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p style="color:#555;line-height:1.6;">Bạn đã để lại một số sản phẩm trong giỏ hàng. Đừng để chúng chờ lâu nhé!</p>
        <ul style="padding-left:20px;color:#333;">${itemsHtml}</ul>
        ${moreText}
        <div style="margin-top:24px;text-align:center;">
          <a href="${appUrl()}/cart"
             style="display:inline-block;background:#ff5722;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            Quay lại giỏ hàng →
          </a>
        </div>
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}

export async function sendReviewRequestEmail(
  userEmail: string,
  userName: string | null,
  orderId: string,
  productTitle: string,
) {
  const name = escapeHtml(userName || "bạn");
  const title = escapeHtml(productTitle);
  return deliverEmail("review_request", orderId, {
    to: userEmail,
    subject: `Bạn có hài lòng với ${productTitle}? ⭐`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <h2 style="color:#ff5722;margin:0 0 16px;">🤖 RoboEQ — Đánh giá sản phẩm</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p style="color:#555;line-height:1.6;">Đã 7 ngày kể từ khi bạn nhận được <strong>${title}</strong> từ đơn hàng <strong>#${escapeHtml(orderId.slice(0, 8).toUpperCase())}</strong>.</p>
        <p style="color:#555;line-height:1.6;">Bạn có hài lòng với sản phẩm không? Đánh giá của bạn giúp ích rất nhiều cho những người mua tiếp theo — chỉ mất 1 phút thôi!</p>
        <div style="margin-top:24px;text-align:center;">
          <a href="${appUrl()}/profile/orders"
             style="display:inline-block;background:#ff5722;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            Viết đánh giá ngay →
          </a>
        </div>
        <p>Trân trọng,<br><strong>Đội ngũ RoboEQ</strong></p>
      </div>`,
  });
}
