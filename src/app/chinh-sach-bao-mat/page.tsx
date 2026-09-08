import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/legal/policy-shell";
import { getBusinessIdentity } from "@/lib/commerce-policy";

export const metadata: Metadata = {
  title: "Chính sách bảo mật thông tin - RoboEQ",
  description: "Cách RoboEQ thu thập, sử dụng, lưu giữ và bảo vệ dữ liệu cá nhân.",
};

export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  const business = getBusinessIdentity();

  return (
    <PolicyShell
      title="Chính sách bảo mật thông tin"
      summary="Chính sách này giải thích dữ liệu RoboEQ xử lý khi bạn truy cập website, tạo tài khoản, đặt hàng hoặc yêu cầu hỗ trợ."
    >
      <section>
        <h2>1. Đơn vị kiểm soát dữ liệu</h2>
        <p>
          {business.legalName}, địa chỉ {business.address}, vận hành website RoboEQ và chịu trách nhiệm
          tiếp nhận yêu cầu liên quan đến dữ liệu cá nhân. Bạn có thể liên hệ qua số {business.supportPhone}
          {business.supportEmail ? ` hoặc email ${business.supportEmail}` : ""}.
        </p>
      </section>

      <section>
        <h2>2. Dữ liệu được thu thập</h2>
        <ul>
          <li>Thông tin tài khoản: họ tên, số điện thoại, email, mã định danh tài khoản và mật khẩu đã băm.</li>
          <li>Thông tin giao dịch: sản phẩm, giá, mã ưu đãi, điểm thưởng, người nhận, địa chỉ, số điện thoại và lịch sử trạng thái đơn.</li>
          <li>Thông tin thanh toán: phương thức, số tiền, trạng thái và mã đối soát. RoboEQ không lưu toàn bộ số thẻ hoặc mã bảo mật thẻ.</li>
          <li>Nội dung bạn gửi: đánh giá, yêu cầu liên hệ, yêu cầu bảo hành/đổi trả và ảnh minh chứng.</li>
          <li>Dữ liệu kỹ thuật và an toàn: thời điểm truy cập, lỗi hệ thống, thông tin phiên và dấu vết mạng đã băm dùng để chống lạm dụng.</li>
          <li>Dữ liệu cơ bản do nhà cung cấp đăng nhập Google hoặc Facebook chuyển cho RoboEQ khi bạn tự chọn cách đăng nhập này.</li>
        </ul>
      </section>

      <section>
        <h2>3. Mục đích xử lý</h2>
        <p>
          RoboEQ dùng dữ liệu để xác thực tài khoản; báo giá và thực hiện đơn hàng; thanh toán, giao nhận,
          bảo hành và đổi trả; vận hành điểm thưởng và chương trình giới thiệu; trả lời hỗ trợ; phòng chống gian
          lận; khắc phục lỗi; thực hiện nghĩa vụ kế toán, thuế và yêu cầu hợp pháp của cơ quan có thẩm quyền.
        </p>
        <p>
          Thông tin tiếp thị chỉ được gửi khi có căn cứ phù hợp và bạn có thể yêu cầu dừng nhận. Nội dung nhập
          vào trợ lý AI có thể được chuyển đến nhà cung cấp mô hình được cấu hình để tạo câu trả lời; không nên
          nhập mật khẩu, OTP, thông tin thẻ hoặc dữ liệu nhạy cảm vào khung chat.
        </p>
      </section>

      <section>
        <h2>4. Bên nhận dữ liệu</h2>
        <p>
          Trong phạm vi cần thiết cho từng dịch vụ, dữ liệu có thể được chia sẻ với đơn vị thanh toán, ngân hàng,
          vận chuyển, email/SMS, lưu trữ ảnh, hạ tầng máy chủ, đăng nhập mạng xã hội và nhà cung cấp AI. Các bên
          này chỉ nhận nhóm dữ liệu cần cho nhiệm vụ của họ và tự chịu trách nhiệm theo điều khoản, chính sách
          của họ. RoboEQ cũng có thể cung cấp dữ liệu khi pháp luật yêu cầu hoặc để bảo vệ quyền lợi hợp pháp.
        </p>
        <p>RoboEQ không bán dữ liệu cá nhân của khách hàng.</p>
      </section>

      <section>
        <h2>5. Cookie và lưu trữ trên thiết bị</h2>
        <p>
          Website dùng cookie phiên và vùng lưu trữ trình duyệt cần thiết cho đăng nhập, giỏ hàng, bảo mật và tùy
          chọn giao diện. Hiện website không cài cookie quảng cáo hành vi. Việc chặn cookie thiết yếu có thể làm
          đăng nhập hoặc thanh toán không hoạt động đúng.
        </p>
      </section>

      <section>
        <h2>6. Thời gian lưu giữ</h2>
        <p>
          Dữ liệu tài khoản được giữ trong thời gian tài khoản hoạt động; hồ sơ đơn hàng, thanh toán và hóa đơn
          được giữ theo thời hạn cần thiết cho kế toán, thuế, giải quyết tranh chấp và nghĩa vụ pháp luật. OTP có
          thời hạn ngắn và không còn giá trị sau khi dùng hoặc hết hạn. Hồ sơ hỗ trợ, RMA và nhật ký an toàn được
          giữ trong thời gian phù hợp với mục đích xử lý, sau đó xóa hoặc ẩn danh khi không còn cần thiết.
        </p>
      </section>

      <section>
        <h2>7. Bảo vệ dữ liệu và sự cố</h2>
        <p>
          RoboEQ áp dụng phân quyền, băm mật khẩu và OTP, kết nối HTTPS, giới hạn yêu cầu, nhật ký kiểm toán,
          sao lưu và giới hạn dữ liệu trả về giao diện. Không hệ thống nào loại bỏ hoàn toàn rủi ro; khi phát hiện
          sự cố có ảnh hưởng, RoboEQ sẽ cô lập, điều tra và thông báo theo phạm vi pháp luật yêu cầu.
        </p>
      </section>

      <section>
        <h2>8. Quyền của bạn</h2>
        <p>
          Bạn có thể yêu cầu xem, sửa, rút lại sự đồng ý, hạn chế hoặc xóa dữ liệu trong phạm vi pháp luật cho
          phép. Một số hồ sơ giao dịch phải tiếp tục được lưu theo nghĩa vụ pháp lý. Để xác minh yêu cầu, RoboEQ
          có thể đề nghị thông tin đủ để đối chiếu chủ tài khoản hoặc đơn hàng.
        </p>
      </section>

      <section>
        <h2>9. Người chưa thành niên và thay đổi chính sách</h2>
        <p>
          Sản phẩm có thể dành cho trẻ em nhưng giao dịch và tài khoản phải do người có đủ năng lực hành vi hoặc
          người đại diện hợp pháp thực hiện. RoboEQ không chủ đích thu thập trực tiếp dữ liệu của trẻ em. Phiên
          bản cập nhật sẽ được đăng trên trang này cùng ngày hiệu lực mới.
        </p>
      </section>

      <p>
        Gửi yêu cầu về quyền riêng tư tại <Link href="/lien-he">trang liên hệ</Link>
        {business.supportEmail ? ` hoặc ${business.supportEmail}` : ""}.
      </p>
    </PolicyShell>
  );
}
