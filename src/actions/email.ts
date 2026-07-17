// Mock Email Service for Order Confirmation
// In production, replace this with Resend (https://resend.com) or Nodemailer

export async function sendOrderConfirmationEmail(userEmail: string, orderId: string, totalAmount: number) {
  if (!userEmail) return;

  const formattedTotal = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount);

  const emailHtml = `
  <h1>Cảm ơn bạn đã đặt hàng tại Web Robot AI!</h1>
  <p>Đơn hàng của bạn đã được xác nhận thành công.</p>
  <div style="padding: 16px; border: 1px solid #eee; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> ${orderId.toUpperCase()}</p>
    <p><strong>Tổng thanh toán:</strong> ${formattedTotal}</p>
    <p><strong>Trạng thái:</strong> Đang xử lý</p>
  </div>
  <p>Bạn có thể theo dõi trạng thái đơn hàng trong phần Lịch sử mua hàng.</p>
  <p>Trân trọng,<br/>Đội ngũ Web Robot AI</p>
  `;

  // MOCK: Simulate sending email
  console.log("=========================================");
  console.log(`[EMAIL SENT TO: ${userEmail}]`);
  console.log(`Subject: Xác nhận đơn hàng #${orderId.toUpperCase()}`);
  console.log("Body:");
  console.log(emailHtml);
  console.log("=========================================");

  // TODO: Implement real Resend logic here when API_KEY is available:
  /*
  import { Resend } from 'resend';
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Web Robot AI <no-reply@yourdomain.com>',
    to: [userEmail],
    subject: `Xác nhận đơn hàng #${orderId.toUpperCase()}`,
    html: emailHtml,
  });
  */
}
