import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Liên hệ - RoboEd",
  description: "Thông tin liên hệ RoboEd.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white my-8 rounded-sm shadow-sm border border-neutral-100">
      <h1 className="text-3xl font-bold mb-8 text-[#FF5722] font-heading uppercase text-center border-b pb-4">
        Liên hệ với chúng tôi
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Thông tin liên hệ</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-[#FF5722]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Địa chỉ</h3>
                <p className="text-neutral-600 mt-1">CÔNG TY TNHH TM&DV GTK_REVEILLE<br/>Chi nhánh: Goertek Nam Sơn - Hạp Lĩnh, Bắc Ninh</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-[#FF5722]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Điện thoại / Zalo</h3>
                <p className="text-neutral-600 mt-1">0385.333.111</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-[#FF5722]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Email</h3>
                <p className="text-neutral-600 mt-1">support@roboed.vn</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#FF5722]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Giờ làm việc</h3>
                <p className="text-neutral-600 mt-1">Thứ 2 - Thứ 7: 08:00 - 17:30<br/>Chủ nhật: Nghỉ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 p-6 rounded-sm border border-neutral-200">
          <h2 className="text-xl font-bold mb-4 text-foreground">Gửi tin nhắn</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input type="text" className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:border-[#FF5722]" placeholder="Nhập họ tên của bạn" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input type="text" className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:border-[#FF5722]" placeholder="Nhập số điện thoại" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nội dung</label>
              <textarea rows={4} className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:border-[#FF5722]" placeholder="Nội dung cần hỗ trợ..."></textarea>
            </div>
            <button type="button" className="w-full bg-[#FF5722] text-white font-bold py-3 rounded-sm hover:bg-[#E64A19] transition-colors">
              Gửi yêu cầu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
