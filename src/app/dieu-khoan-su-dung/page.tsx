import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/legal/policy-shell";
import { getBusinessIdentity } from "@/lib/commerce-policy";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng và mua bán - RoboEQ",
  description: "Điều khoản sử dụng website, tài khoản và giao dịch mua bán tại RoboEQ.",
};

export const dynamic = "force-dynamic";

export default function TermsPage() {
  const business = getBusinessIdentity();

  return (
    <PolicyShell
      title="Điều khoản sử dụng & mua bán"
      summary="Khi sử dụng website hoặc đặt hàng, bạn xác nhận đã đọc và đồng ý với các điều khoản áp dụng cho dịch vụ RoboEQ."
    >
      <section>
        <h2>1. Thông tin đơn vị bán hàng</h2>
        <dl>
          <div><dt>Tên pháp lý</dt><dd>{business.legalName}</dd></div>
          {business.taxCode && <div><dt>Mã số thuế</dt><dd>{business.taxCode}</dd></div>}
          {business.registrationNumber && <div><dt>Đăng ký kinh doanh</dt><dd>{business.registrationNumber}</dd></div>}
          <div><dt>Địa chỉ</dt><dd>{business.address}</dd></div>
          <div><dt>Điện thoại</dt><dd>{business.supportPhone}</dd></div>
          {business.supportEmail && <div><dt>Email</dt><dd>{business.supportEmail}</dd></div>}
        </dl>
      </section>

      <section>
        <h2>2. Điều kiện sử dụng</h2>
        <p>
          Người đặt hàng phải có đủ năng lực thực hiện giao dịch hoặc được người đại diện hợp pháp đồng ý. Bạn
          chịu trách nhiệm về tính chính xác của thông tin cung cấp, bảo vệ thông tin đăng nhập và thông báo ngay
          khi nghi ngờ tài khoản bị sử dụng trái phép.
        </p>
        <p>
          Không được dùng website để gian lận thanh toán, chiếm đoạt ưu đãi, gây quá tải, dò quét trái phép, đăng
          nội dung vi phạm pháp luật hoặc xâm phạm quyền của người khác. RoboEQ có thể giới hạn phiên hoặc tài
          khoản có dấu hiệu lạm dụng và lưu bằng chứng cần thiết để xử lý.
        </p>
      </section>

      <section>
        <h2>3. Thông tin sản phẩm và giá</h2>
        <p>
          RoboEQ cố gắng trình bày chính xác tên, hình ảnh, biến thể, giá và tồn kho. Màu sắc có thể khác nhẹ theo
          màn hình; nội dung “dự kiến” của hàng đặt trước không phải cam kết ngày giao tuyệt đối. Giá và ưu đãi áp
          dụng là số liệu máy chủ xác nhận tại lúc tạo đơn, thể hiện trong phần tổng kết trước khi khách đặt hàng.
        </p>
      </section>

      <section>
        <h2>4. Tạo và xác nhận đơn</h2>
        <p>
          Sau khi khách gửi yêu cầu, hệ thống tạo mã đơn và giữ tồn kho theo điều kiện thanh toán. RoboEQ có thể
          liên hệ để xác minh người nhận, địa chỉ, hàng đặt trước hoặc giao dịch bất thường. Trường hợp lỗi hiển
          thị rõ ràng, hết hàng do cập nhật đồng thời hoặc không thể xác minh thanh toán, RoboEQ sẽ thông báo và
          hoàn khoản đã nhận nếu có.
        </p>
        <p>
          Khách có thể tự hủy khi đơn còn “Chờ xử lý” và chưa được ghi nhận thanh toán. Sau khi bắt đầu xử lý,
          yêu cầu thay đổi hoặc hủy được tiếp nhận qua kênh hỗ trợ và phụ thuộc trạng thái thực tế của kiện hàng.
        </p>
      </section>

      <section>
        <h2>5. Thanh toán và giao nhận</h2>
        <p>
          Phương thức, tiền cọc, đối soát và hoàn tiền tuân theo <Link href="/chinh-sach-thanh-toan">chính sách thanh toán</Link>.
          Phạm vi, phí và thời gian giao dự kiến tuân theo <Link href="/chinh-sach-van-chuyen">chính sách vận chuyển</Link>.
        </p>
      </section>

      <section>
        <h2>6. Đổi trả và bảo hành</h2>
        <p>
          Điều kiện RMA, chi phí gửi hàng, điểm thưởng và hoàn tiền được quy định tại <Link href="/chinh-sach-doi-tra">chính sách đổi trả</Link>.
          Thông tin serial và thời hạn bảo hành được tra cứu tại <Link href="/bao-hanh">trang bảo hành</Link>.
        </p>
      </section>

      <section>
        <h2>7. Điểm thưởng, mã ưu đãi và giới thiệu</h2>
        <p>
          Điểm và mã ưu đãi chỉ có giá trị theo điều kiện hiển thị, không tự động quy đổi thành tiền mặt và có thể
          bị thu hồi khi đơn bị hủy, trả hoặc có gian lận. Hoa hồng giới thiệu chỉ được chi cho đơn đã giao, thanh
          toán đủ và có thể bị đảo trạng thái nếu giao dịch sau đó được hoàn trả.
        </p>
      </section>

      <section>
        <h2>8. Đánh giá và nội dung người dùng</h2>
        <p>
          Bạn phải có quyền đối với nội dung gửi lên và không đăng dữ liệu cá nhân của người khác, nội dung sai
          sự thật, xúc phạm hoặc quảng cáo rác. RoboEQ có thể ẩn nội dung vi phạm và dùng nội dung hợp lệ trong
          phạm vi cần thiết để hiển thị, kiểm duyệt và vận hành dịch vụ.
        </p>
      </section>

      <section>
        <h2>9. Quyền sở hữu và giới hạn dịch vụ</h2>
        <p>
          Nhãn hiệu, thiết kế, mã nguồn và nội dung do RoboEQ sở hữu hoặc được cấp phép được bảo vệ theo pháp luật.
          Dịch vụ có thể tạm gián đoạn để bảo trì hoặc do sự kiện ngoài khả năng kiểm soát hợp lý. Không nội dung
          nào trong điều khoản này loại trừ quyền bắt buộc của người tiêu dùng hoặc trách nhiệm không được phép
          loại trừ theo pháp luật Việt Nam.
        </p>
      </section>

      <section>
        <h2>10. Khiếu nại, tranh chấp và cập nhật</h2>
        <p>
          Hãy gửi mã đơn và nội dung cần giải quyết qua <Link href="/lien-he">trang liên hệ</Link>, số
          {" "}{business.supportPhone}{business.supportEmail ? ` hoặc ${business.supportEmail}` : ""}. Hai bên ưu
          tiên thương lượng; nếu không đạt thỏa thuận, tranh chấp được giải quyết theo pháp luật Việt Nam tại cơ
          quan có thẩm quyền. Phiên bản mới được công bố trên trang này và áp dụng từ ngày hiệu lực ghi phía trên.
        </p>
      </section>
    </PolicyShell>
  );
}
