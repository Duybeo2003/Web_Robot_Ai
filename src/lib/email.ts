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
