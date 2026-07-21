export const metadata = {
  title: "Giới thiệu - RoboEd",
  description: "Tìm hiểu về RoboEd - Nền tảng cung cấp đồ chơi giáo dục STEM hàng đầu.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white my-8 rounded-sm shadow-sm border border-neutral-100">
      <h1 className="text-3xl font-bold mb-8 text-[#FF5722] font-heading uppercase text-center border-b pb-4">
        Giới thiệu về RoboEd
      </h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700 leading-relaxed">
        <p>
          Chào mừng bạn đến với <strong>RoboEd (Robot Thông Minh)</strong> - Nền tảng chuyên cung cấp các sản phẩm đồ chơi giáo dục STEM, kit tự học Arduino, và đồ chơi phát triển tư duy logic hàng đầu tại Việt Nam.
        </p>
        <p>
          Được thành lập với sứ mệnh "Khơi dậy niềm đam mê khoa học và công nghệ", RoboEd cam kết mang đến cho trẻ em và học sinh sinh viên những công cụ học tập tiên tiến nhất. Chúng tôi tin rằng việc học qua thực hành (hands-on learning) là phương pháp hiệu quả nhất để phát triển tư duy sáng tạo và giải quyết vấn đề.
        </p>
        <h3 className="text-xl font-bold text-foreground mt-8">Tầm nhìn & Sứ mệnh</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Tầm nhìn:</strong> Trở thành hệ sinh thái giáo dục STEM số 1 Việt Nam, nơi mọi học sinh đều có cơ hội tiếp cận công nghệ từ sớm.</li>
          <li><strong>Sứ mệnh:</strong> Cung cấp sản phẩm chất lượng cao, an toàn, với giá thành hợp lý kèm theo tài liệu hướng dẫn chi tiết, giúp việc học STEM trở nên dễ dàng và thú vị.</li>
        </ul>
        <h3 className="text-xl font-bold text-foreground mt-8">Giá trị cốt lõi</h3>
        <p>
          Chất lượng - Đổi mới - Sáng tạo - Tận tâm. Chúng tôi luôn đặt lợi ích của người học lên hàng đầu và không ngừng cải tiến để mang lại những trải nghiệm tốt nhất.
        </p>
      </div>
    </div>
  );
}
