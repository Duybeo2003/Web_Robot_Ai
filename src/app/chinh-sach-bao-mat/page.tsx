export const metadata = {
  title: "Chính sách bảo mật thông tin - RoboEd",
  description: "Chính sách bảo mật thông tin khách hàng tại RoboEd.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white my-8 rounded-sm shadow-sm border border-neutral-100">
      <h1 className="text-3xl font-bold mb-8 text-[#FF5722] font-heading uppercase text-center border-b pb-4">
        Chính sách bảo mật thông tin
      </h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700 leading-relaxed">
        <p>Cám ơn quý khách đã truy cập vào website của RoboEd. Chúng tôi tôn trọng và cam kết sẽ bảo mật những thông tin mang tính riêng tư của bạn. Xin vui lòng đọc bản Chính sách bảo mật dưới đây để hiểu hơn những cam kết mà chúng tôi thực hiện, nhằm tôn trọng và bảo vệ quyền lợi của người truy cập.</p>
        
        <h3 className="text-xl font-bold text-foreground mt-6">1. Thu thập thông tin cá nhân</h3>
        <p>Chúng tôi sẽ thu thập nhiều thông tin khác nhau của bạn khi bạn muốn đặt hàng trên web. Việc thu thập dữ liệu chủ yếu trên website bao gồm: email, điện thoại, tên đăng nhập, mật khẩu đăng nhập, địa chỉ khách hàng. Đây là các thông tin mà chúng tôi cần thành viên cung cấp bắt buộc khi đăng ký sử dụng dịch vụ và để liên hệ xác nhận khi khách hàng đăng ký sử dụng dịch vụ trên website nhằm đảm bảo quyền lợi cho người tiêu dùng.</p>

        <h3 className="text-xl font-bold text-foreground mt-6">2. Phạm vi sử dụng thông tin</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Cung cấp các dịch vụ đến người dùng.</li>
          <li>Gửi các thông báo về các hoạt động trao đổi thông tin giữa người dùng và RoboEd.</li>
          <li>Ngừa các hoạt động phá hủy tài khoản người dùng của người dùng hoặc các hoạt động giả mạo người dùng.</li>
          <li>Liên lạc và giải quyết với người dùng trong những trường hợp đặc biệt.</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground mt-6">3. Thời gian lưu trữ thông tin</h3>
        <p>Dữ liệu cá nhân của Thành viên sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ hoặc tự thành viên đăng nhập và thực hiện hủy bỏ. Còn lại trong mọi trường hợp thông tin cá nhân thành viên sẽ được bảo mật trên máy chủ của hệ thống.</p>

        <h3 className="text-xl font-bold text-foreground mt-6">4. Cam kết bảo mật</h3>
        <p>Thông tin cá nhân của người dùng trên RoboEd được cam kết bảo mật tuyệt đối theo chính sách bảo vệ thông tin cá nhân của công ty. Việc thu thập và sử dụng thông tin của mỗi người dùng chỉ được thực hiện khi có sự đồng ý của khách hàng đó trừ những trường hợp pháp luật có quy định khác.</p>
      </div>
    </div>
  );
}
