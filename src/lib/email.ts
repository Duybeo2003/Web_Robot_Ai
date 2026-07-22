import nodemailer from "nodemailer"

// Create a reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOrderConfirmationEmail(userEmail: string, orderId: string, totalAmount: number, items: any[]) {
  if (!process.env.SMTP_USER || process.env.SMTP_PASS === 'your-app-password') {
    console.log(`[MOCK EMAIL] To: ${userEmail} - Order ${orderId} confirmed.`)
    return { success: true, mocked: true }
  }

  const itemsListHtml = items.map(item => 
    `<li>${item.product?.title || 'Sản phẩm'} x ${item.quantity} - ${Number(item.priceAtPurchase).toLocaleString('vi-VN')}đ</li>`
  ).join('')

  const mailOptions = {
    from: `"RoboEd" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Xác nhận đơn hàng #${orderId} từ RoboEd`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF5722;">Cảm ơn bạn đã đặt hàng tại RoboEd!</h2>
        <p>Đơn hàng <strong>#${orderId}</strong> của bạn đã được ghi nhận và đang được xử lý.</p>
        
        <h3>Chi tiết đơn hàng:</h3>
        <ul>
          ${itemsListHtml}
        </ul>
        
        <p><strong>Tổng cộng:</strong> <span style="color: #FF5722; font-size: 18px; font-weight: bold;">${Number(totalAmount).toLocaleString('vi-VN')}đ</span></p>
        
        <p>Bạn có thể theo dõi trạng thái đơn hàng trong phần <a href="${process.env.NEXTAUTH_URL}/profile/orders">Lịch sử đơn hàng</a>.</p>
        <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
        
        <br>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ RoboEd</strong></p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Message sent: %s", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendAdminNewOrderNotification(orderId: string, totalAmount: number) {
  if (!process.env.ADMIN_EMAIL || process.env.SMTP_PASS === 'your-app-password') {
    console.log(`[MOCK EMAIL] To Admin: New order ${orderId}.`)
    return { success: true, mocked: true }
  }

  const mailOptions = {
    from: `"RoboEd System" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `[Thông báo] Có đơn hàng mới #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: #2E7D32;">Có đơn đặt hàng mới!</h2>
        <p>Một khách hàng vừa đặt đơn hàng <strong>#${orderId}</strong> trên hệ thống.</p>
        <p><strong>Tổng giá trị:</strong> ${Number(totalAmount).toLocaleString('vi-VN')}đ</p>
        <p>Vui lòng đăng nhập vào <a href="${process.env.NEXTAUTH_URL}/admin/orders">Trang Quản Trị</a> để xem chi tiết và xử lý đơn hàng.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending admin notification:", error)
    return { success: false, error }
  }
}
