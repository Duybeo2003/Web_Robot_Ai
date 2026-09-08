import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/legal/policy-shell";
import {
  getBusinessIdentity,
  PAYMENT_RESERVATION_HOURS,
  VNPAY_RESERVATION_MINUTES,
} from "@/lib/commerce-policy";

export const metadata: Metadata = {
  title: "Chính sách thanh toán - RoboEQ",
  description: "Phương thức thanh toán, tiền cọc, đối soát và hoàn tiền tại RoboEQ.",
};

export const dynamic = "force-dynamic";

export default function PaymentPolicyPage() {
  const business = getBusinessIdentity();
  const bankId = process.env.BANK_ID?.trim() || "";
  const accountNo = process.env.BANK_ACCOUNT_NO?.trim() || "";
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim() || "";
  const bankConfigured = Boolean(bankId && accountNo && accountName);

  return (
    <PolicyShell
      title="Chính sách thanh toán"
      summary="Số tiền phải trả được chốt ở máy chủ theo giá, biến thể, ưu đãi và điểm thưởng tại thời điểm tạo đơn."
    >
      <section>
        <h2>1. Thanh toán khi nhận hàng (COD)</h2>
        <p>
          Khách hàng thanh toán bằng đồng Việt Nam cho đơn vị giao hàng khi nhận sản phẩm. COD không áp dụng cho
          đơn có sản phẩm đặt trước cần tiền cọc. Nếu đơn đã trả cọc, phần còn lại có thể được ghi nhận là COD và
          hiển thị riêng trong chi tiết thanh toán.
        </p>
      </section>

      <section>
        <h2>2. Chuyển khoản ngân hàng / VietQR</h2>
        <p>
          Chỉ chuyển đúng số tiền và nội dung hiển thị trên trang xác nhận của đơn. Tồn kho của giao dịch chờ
          thanh toán được giữ tối đa {PAYMENT_RESERVATION_HOURS} giờ; hết thời hạn mà chưa đối soát, đơn có thể tự
          hủy và tồn kho được trả lại.
        </p>
        {bankConfigured ? (
          <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4">
            <p><strong>Ngân hàng:</strong> {bankId.toUpperCase()}</p>
            <p><strong>Chủ tài khoản:</strong> {accountName}</p>
            <p><strong>Số tài khoản:</strong> {accountNo}</p>
            <p><strong>Nội dung:</strong> RoboEQ [MÃ ĐƠN HÀNG]</p>
          </div>
        ) : (
          <p className="rounded-sm border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Kênh chuyển khoản hiện chưa được cấu hình. Website sẽ không cho tạo đơn mới bằng phương thức này.
          </p>
        )}
      </section>

      <section>
        <h2>3. Thanh toán qua VNPay</h2>
        <p>
          Khách hàng được chuyển sang cổng VNPay để thanh toán. RoboEQ chỉ ghi nhận tiền sau khi kiểm tra chữ ký,
          mã giao dịch, số tiền và thông báo máy chủ (IPN) hợp lệ. Nếu rời cổng hoặc giao dịch thất bại, bạn có thể
          thử lại từ trang đơn hàng trong thời gian tồn kho còn được giữ.
        </p>
        <p>
          Tồn kho cho lần tạo đơn VNPay được giữ {VNPAY_RESERVATION_MINUTES} phút. Nếu hết hạn, hệ thống hủy đơn
          chưa thanh toán và trả tồn kho; khách hàng cần tạo đơn mới theo tồn kho hiện tại.
        </p>
      </section>

      <section>
        <h2>4. Đặt trước và tiền cọc</h2>
        <p>
          Tỷ lệ cọc của từng sản phẩm đặt trước được hiển thị trước khi thanh toán. Ưu đãi và điểm thưởng được phân
          bổ theo tỷ lệ vào giá trị cọc. Sau khi tiền cọc được xác nhận, số còn lại và cách thanh toán được hiển
          thị trên đơn. Thời gian giao dự kiến phụ thuộc thông tin đặt trước của từng sản phẩm.
        </p>
      </section>

      <section>
        <h2>5. Xác nhận và an toàn giao dịch</h2>
        <p>
          Mỗi lần thanh toán có mã giao dịch và cơ chế chống ghi nhận trùng. Nhân viên chỉ xác nhận thủ công khi
          có mã đối soát từ ngân hàng hoặc nhà cung cấp. RoboEQ không yêu cầu bạn cung cấp mật khẩu, OTP, mã CVV
          hoặc ảnh chứa đầy đủ thông tin thẻ qua điện thoại, chat hay email.
        </p>
      </section>

      <section>
        <h2>6. Sai lệch và hoàn tiền</h2>
        <p>
          Nếu đã chuyển tiền nhưng đơn chưa cập nhật, hãy gửi mã đơn, số tiền, thời gian và mã giao dịch qua
          <Link href="/lien-he"> trang liên hệ</Link>. Hoàn tiền chỉ được xác nhận sau quy trình đổi trả hoặc xử lý
          sai giao dịch, có mã đối soát và tuân theo <Link href="/chinh-sach-doi-tra">chính sách đổi trả</Link>.
        </p>
      </section>

      <p>
        Kênh hỗ trợ thanh toán: {business.supportPhone}
        {business.supportEmail ? ` · ${business.supportEmail}` : ""}.
      </p>
    </PolicyShell>
  );
}
