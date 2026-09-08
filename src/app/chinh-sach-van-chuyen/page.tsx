import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/legal/policy-shell";
import { getBusinessIdentity } from "@/lib/commerce-policy";

export const metadata: Metadata = {
  title: "Chính sách vận chuyển - RoboEQ",
  description: "Phí, phạm vi, thời gian và quy trình giao nhận đơn hàng RoboEQ.",
};

export const dynamic = "force-dynamic";

export default function ShippingPolicyPage() {
  const business = getBusinessIdentity();

  return (
    <PolicyShell
      title="Chính sách vận chuyển"
      summary="Các đơn tạo trực tiếp trên website RoboEQ hiện được miễn phí giao hàng tiêu chuẩn trên toàn quốc."
    >
      <section>
        <h2>1. Phí và phạm vi giao hàng</h2>
        <p>
          Phí vận chuyển tiêu chuẩn trên trang thanh toán là 0đ cho mọi đơn website đến địa chỉ hợp lệ tại Việt
          Nam. Dịch vụ hỏa tốc, giao theo giờ hoặc yêu cầu đặc biệt chỉ phát sinh khi khách hàng chủ động đồng ý
          mức phí riêng trước khi sử dụng.
        </p>
      </section>

      <section>
        <h2>2. Xử lý và thời gian dự kiến</h2>
        <p>
          Đơn chỉ được bàn giao cho đơn vị vận chuyển sau khi đáp ứng điều kiện thanh toán tương ứng. Thời gian
          tham khảo, tính theo ngày làm việc kể từ khi đơn bắt đầu xử lý:
        </p>
        <ul>
          <li>Bắc Ninh và Hà Nội: khoảng 1–2 ngày làm việc.</li>
          <li>Các tỉnh, thành khác: khoảng 3–5 ngày làm việc.</li>
          <li>Vùng xa, thời tiết bất lợi hoặc cao điểm lễ, Tết có thể lâu hơn.</li>
        </ul>
        <p>
          Sản phẩm đặt trước tuân theo ngày dự kiến ghi trên trang sản phẩm hoặc xác nhận riêng; mốc này có thể
          khác thời gian giao hàng tiêu chuẩn.
        </p>
      </section>

      <section>
        <h2>3. Theo dõi và thay đổi thông tin nhận hàng</h2>
        <p>
          Khi tạo vận đơn, mã theo dõi được cập nhật vào đơn hàng. Hãy liên hệ sớm nếu cần sửa người nhận, số điện
          thoại hoặc địa chỉ. RoboEQ không bảo đảm thay đổi được thông tin sau khi kiện hàng đã bàn giao cho đơn vị
          vận chuyển.
        </p>
      </section>

      <section>
        <h2>4. Kiểm tra khi nhận</h2>
        <p>
          Khách hàng nên kiểm tra tình trạng bao bì, số kiện, mẫu sản phẩm và dấu hiệu hư hỏng bên ngoài trước khi
          nhận. Việc mở kiện phụ thuộc quy định của đơn vị vận chuyển. Nếu kiện móp, rách, thiếu hoặc sai hàng,
          hãy chụp ảnh/video, ghi nhận với nhân viên giao hàng và liên hệ RoboEQ ngay.
        </p>
      </section>

      <section>
        <h2>5. Giao không thành công</h2>
        <p>
          Khách hàng chịu trách nhiệm cung cấp địa chỉ và số điện thoại chính xác, đồng thời phối hợp nhận hàng.
          Sau các lần giao không thành công, kiện có thể được hoàn về và đơn được cập nhật theo kết quả thực tế.
          RoboEQ sẽ liên hệ trước khi tạo lượt giao mới có chi phí phát sinh do thông tin sai hoặc khách từ chối
          nhận không thuộc lỗi của RoboEQ.
        </p>
      </section>

      <section>
        <h2>6. Hư hỏng, thiếu hoặc thất lạc</h2>
        <p>
          Gửi mã đơn và minh chứng qua <Link href="/lien-he">trang liên hệ</Link> hoặc gọi {business.supportPhone}.
          RoboEQ phối hợp với đơn vị vận chuyển và xử lý theo <Link href="/chinh-sach-doi-tra">chính sách đổi trả</Link>.
        </p>
      </section>
    </PolicyShell>
  );
}
