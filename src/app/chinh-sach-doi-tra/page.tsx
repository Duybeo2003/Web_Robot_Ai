import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/legal/policy-shell";
import { getBusinessIdentity, RETURN_WINDOW_DAYS } from "@/lib/commerce-policy";

export const metadata: Metadata = {
  title: "Chính sách đổi trả và hoàn tiền - RoboEQ",
  description: "Điều kiện, quy trình RMA, đổi sản phẩm và hoàn tiền tại RoboEQ.",
};

export const dynamic = "force-dynamic";

export default function ReturnPolicyPage() {
  const business = getBusinessIdentity();

  return (
    <PolicyShell
      title="Chính sách đổi trả & hoàn tiền"
      summary={`RoboEQ tiếp nhận yêu cầu RMA trong ${RETURN_WINDOW_DAYS} ngày kể từ khi đơn được xác nhận giao thành công.`}
    >
      <section>
        <h2>1. Phạm vi và thời hạn</h2>
        <p>
          Khách hàng đã đăng nhập có thể gửi yêu cầu tại mục <Link href="/profile/orders">Đơn hàng của tôi</Link>
          {" "}trong vòng {RETURN_WINDOW_DAYS} ngày kể từ thời điểm đơn chuyển sang “Đã giao thành công”. Khách mua
          không đăng nhập liên hệ số {business.supportPhone} và cung cấp mã đơn cùng số điện thoại nhận hàng để
          được xác minh. Sau thời hạn này, lỗi thuộc phạm vi bảo hành được xử lý theo chính sách bảo hành.
        </p>
        <p>
          Cổng RMA trực tuyến ghi nhận một yêu cầu cho toàn bộ đơn. Nếu chỉ một sản phẩm trong đơn gặp lỗi, hãy
          mô tả rõ tên và số lượng để nhân viên xác nhận phương án đổi riêng trước khi bạn gửi hàng.
        </p>
      </section>

      <section>
        <h2>2. Trường hợp được tiếp nhận</h2>
        <ul>
          <li>Sản phẩm giao sai mẫu, sai biến thể, thiếu hàng hoặc khác nội dung đơn đã xác nhận.</li>
          <li>Sản phẩm hư hỏng do vận chuyển hoặc có lỗi kỹ thuật từ nhà sản xuất khi sử dụng đúng hướng dẫn.</li>
          <li>Sản phẩm còn đủ bộ phận, phụ kiện, quà tặng và tem/serial liên quan, trừ phần bị thiếu do lỗi giao hàng.</li>
        </ul>
        <p>
          Ảnh hoặc video mở kiện và mô tả lỗi giúp rút ngắn thời gian xác minh. Tệp ảnh gửi trên website phải là
          JPEG, PNG hoặc WebP, tối đa 5 MB.
        </p>
      </section>

      <section>
        <h2>3. Trường hợp có thể bị từ chối</h2>
        <ul>
          <li>Yêu cầu gửi sau thời hạn đổi trả mà lỗi không thuộc phạm vi bảo hành.</li>
          <li>Hư hỏng do lắp sai, dùng sai nguồn điện, tự sửa đổi, va đập, ngấm nước hoặc không tuân thủ hướng dẫn.</li>
          <li>Thiếu phụ kiện hoặc có dấu hiệu sử dụng vượt mức cần thiết để kiểm tra sản phẩm.</li>
          <li>Yêu cầu đổi vì thay đổi nhu cầu đối với sản phẩm không có lỗi, trừ khi RoboEQ đồng ý riêng bằng văn bản.</li>
        </ul>
      </section>

      <section>
        <h2>4. Quy trình xử lý</h2>
        <ol>
          <li>Gửi RMA kèm lý do và minh chứng; hệ thống ghi nhận trạng thái “Chờ xử lý”.</li>
          <li>RoboEQ liên hệ để xác minh, hướng dẫn đóng gói, địa chỉ nhận và mã gửi hàng.</li>
          <li>Yêu cầu hợp lệ chuyển sang “Đã duyệt”. Chỉ gửi hàng sau khi nhận hướng dẫn.</li>
          <li>Sau khi nhận và kiểm tra, RoboEQ xác nhận hoàn tất, đổi sản phẩm, sửa chữa hoặc tiến hành hoàn tiền theo phương án đã thống nhất.</li>
        </ol>
        <p>Thời gian kiểm tra thông thường là 1–2 ngày làm việc từ khi RoboEQ nhận hàng, có thể lâu hơn nếu cần xác minh kỹ thuật với nhà sản xuất.</p>
      </section>

      <section>
        <h2>5. Chi phí vận chuyển</h2>
        <p>
          RoboEQ chịu chi phí vận chuyển hợp lý hai chiều khi xác nhận giao sai, thiếu, hỏng do vận chuyển hoặc lỗi
          nhà sản xuất. Nếu kết quả kiểm tra cho thấy lỗi do sử dụng hoặc yêu cầu không đủ điều kiện, chi phí gửi
          hàng có thể do khách hàng chịu; RoboEQ sẽ thông báo trước khi phát sinh lượt gửi tiếp theo.
        </p>
      </section>

      <section>
        <h2>6. Hoàn tiền, ưu đãi và điểm thưởng</h2>
        <p>
          Khoản hoàn không vượt quá số tiền RoboEQ đã thực nhận cho phần hàng được chấp thuận. Hoàn tiền được ghi
          nhận bằng mã đối soát và thực hiện qua phương thức phù hợp với giao dịch ban đầu. Thời gian tiền về phụ
          thuộc ngân hàng hoặc cổng thanh toán sau khi RoboEQ hoàn tất xử lý.
        </p>
        <p>
          Điểm đã dùng cho đơn được hoàn lại khi hoàn tiền toàn bộ; điểm đã phát sinh từ phần hàng trả sẽ bị thu
          hồi. Giá trị mã giảm giá không được quy đổi thành tiền mặt. Với phương án đổi hàng, chênh lệch giá và
          quyền lợi đi kèm sẽ được xác nhận trước khi thực hiện.
        </p>
      </section>

      <p>
        Cần hỗ trợ? Liên hệ {business.supportPhone}
        {business.supportEmail ? `, ${business.supportEmail}` : ""} hoặc dùng <Link href="/lien-he">biểu mẫu liên hệ</Link>.
      </p>
    </PolicyShell>
  );
}
