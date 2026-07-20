"use server"

import nodemailer from 'nodemailer';

// You need to configure SMTP settings in .env
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

export async function sendOrderConfirmationEmail(userEmail: string, orderId: string, totalAmount: number) {
  if (!userEmail) return;

  const formattedTotal = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount);

  const emailHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #FF5722;">Cảm ơn bạn đã đặt hàng tại Web Robot AI!</h1>
    <p>Đơn hàng của bạn đã được xác nhận thành công.</p>
    <div style="padding: 16px; border: 1px solid #eee; border-radius: 8px; margin: 16px 0; background-color: #f9f9f9;">
      <p><strong>Mã đơn hàng:</strong> ${orderId.toUpperCase()}</p>
      <p><strong>Tổng thanh toán:</strong> <span style="color: #E30019; font-weight: bold;">${formattedTotal}</span></p>
      <p><strong>Trạng thái:</strong> Đang xử lý</p>
    </div>
    <p>Bạn có thể theo dõi trạng thái đơn hàng trong phần <strong>Lịch sử mua hàng</strong> trên website.</p>
    <p>Trân trọng,<br/>Đội ngũ Web Robot AI</p>
  </div>
  `;

  // Fallback if SMTP is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("=========================================");
    console.log(`[MOCK EMAIL SENT TO: ${userEmail}]`);
    console.log(`Subject: Xác nhận đơn hàng #${orderId.toUpperCase()}`);
    console.log("=========================================");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `Web Robot AI <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Xác nhận đơn hàng #${orderId.toUpperCase()}`,
      html: emailHtml,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
}
