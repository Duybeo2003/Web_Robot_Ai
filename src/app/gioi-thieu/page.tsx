export const metadata = {
  title: "Giới thiệu - RoboEQ",
  description:
    "Tìm hiểu về RoboEQ - Nền tảng cung cấp đồ chơi giáo dục STEM hàng đầu.",
};

export default function AboutPage() {
  return (
    <main className="container mx-auto my-6 max-w-4xl rounded-2xl border border-neutral-200 bg-white px-5 py-8 shadow-sm sm:my-10 sm:px-10 sm:py-12">
      <h1 className="mb-8 border-b border-neutral-200 pb-7 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Giới thiệu về RoboEQ
      </h1>
      <div className="prose prose-neutral max-w-none space-y-6 leading-7 text-neutral-700 prose-headings:font-bold prose-headings:text-foreground">
        <p>
          Chào mừng bạn đến với <strong>RoboEQ (Robot Thông Minh)</strong> - Nền
          tảng chuyên cung cấp các sản phẩm đồ chơi giáo dục STEM, kit tự học
          Arduino, và đồ chơi phát triển tư duy logic hàng đầu tại Việt Nam.
        </p>
        <p>
          Được thành lập với sứ mệnh &quot;Khơi dậy niềm đam mê khoa học và công
          nghệ&quot;, RoboEQ cam kết mang đến cho trẻ em và học sinh sinh viên những
          công cụ học tập tiên tiến nhất. Chúng tôi tin rằng việc học qua thực
          hành (hands-on learning) là phương pháp hiệu quả nhất để phát triển tư
          duy sáng tạo và giải quyết vấn đề.
        </p>
        <h3 className="text-xl font-bold text-foreground mt-8">
          Tầm nhìn & Sứ mệnh
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Tầm nhìn:</strong> Trở thành hệ sinh thái giáo dục STEM số 1
            Việt Nam, nơi mọi học sinh đều có cơ hội tiếp cận công nghệ từ sớm.
          </li>
          <li>
            <strong>Sứ mệnh:</strong> Cung cấp sản phẩm chất lượng cao, an toàn,
            với giá thành hợp lý kèm theo tài liệu hướng dẫn chi tiết, giúp việc
            học STEM trở nên dễ dàng và thú vị.
          </li>
        </ul>
        <h3 className="text-xl font-bold text-foreground mt-8">
          Giá trị cốt lõi
        </h3>
        <p>
          Chất lượng - Đổi mới - Sáng tạo - Tận tâm. Chúng tôi luôn đặt lợi ích
          của người học lên hàng đầu và không ngừng cải tiến để mang lại những
          trải nghiệm tốt nhất.
        </p>
      </div>
    </main>
  );
}
