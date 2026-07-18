import Link from "next/link";
import { BookOpen, PlayCircle, Code2, Download, ChevronRight, Search, Zap, LifeBuoy } from "lucide-react";

export const metadata = {
  title: "Hướng dẫn sử dụng & Tài liệu - RoboEd",
  description: "Trung tâm tài liệu, video hướng dẫn lắp ráp và code mẫu cho các sản phẩm Robot STEM, Arduino.",
};

const guides = [
  {
    id: 1,
    title: "Hướng dẫn lắp ráp Robot STEM Education V2",
    description: "Video chi tiết các bước lắp ráp khung gầm, đấu nối dây điện và cài đặt pin cho phiên bản V2 mới nhất.",
    type: "video",
    icon: PlayCircle,
    color: "text-rose-500",
    bg: "bg-rose-100/50",
    border: "group-hover:border-rose-200"
  },
  {
    id: 2,
    title: "Source Code Mẫu: Dò line & Tránh vật cản",
    description: "Bộ thư viện và code mẫu Arduino (C++) đã được tinh chỉnh, giúp Robot có thể chạy dò line mượt mà.",
    type: "code",
    icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-100/50",
    border: "group-hover:border-blue-200"
  },
  {
    id: 3,
    title: "Sổ tay sử dụng Kit Arduino Uno R3 cơ bản",
    description: "Tài liệu PDF 50 trang hướng dẫn cách cài đặt Arduino IDE, cách nạp code và làm quen với 10 linh kiện cơ bản.",
    type: "document",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-100/50",
    border: "group-hover:border-emerald-200"
  },
  {
    id: 4,
    title: "Phần mềm MBlock 5 (Lập trình kéo thả)",
    description: "Tải xuống phần mềm MBlock phiên bản mới nhất hỗ trợ lập trình Scratch cho các dòng Robot dành cho trẻ em.",
    type: "download",
    icon: Download,
    color: "text-purple-500",
    bg: "bg-purple-100/50",
    border: "group-hover:border-purple-200"
  },
];

export default function GuidesPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-20 font-sans selection:bg-[#FF5722]/20">
      {/* Hero Section with Premium Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#004A8B] via-[#005BAA] to-[#0073D1] py-24 text-center text-white border-b-4 border-[#FF5722]">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-white/10 rotate-12 blur-3xl rounded-full"></div>
          <div className="absolute top-[40%] right-[5%] w-[30%] h-[100%] bg-white/10 -rotate-12 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 animate-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading tracking-tight mb-6 drop-shadow-sm">
            TRUNG TÂM HƯỚNG DẪN
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed mb-10">
            Khám phá tài liệu kỹ thuật, video lắp ráp và mã nguồn lập trình chuyên nghiệp để làm chủ các thiết bị từ RoboEd.
          </p>
          
          {/* Glassmorphism Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5722] to-orange-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/30 rounded-full p-2 shadow-2xl transition-all duration-300 hover:bg-white/20 focus-within:bg-white/20 focus-within:border-white/50">
              <Search className="w-6 h-6 text-white/70 ml-4 shrink-0" />
              <input 
                type="text"
                placeholder="Nhập mã sản phẩm hoặc tên linh kiện..."
                className="w-full px-4 py-3 bg-transparent text-white placeholder-blue-200/70 focus:outline-none text-lg"
              />
              <button className="shrink-0 bg-[#FF5722] hover:bg-[#E64A19] text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
                <Zap className="w-4 h-4 hidden sm:block" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        {/* Categories Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 animate-in zoom-in-95 duration-500 delay-100 fill-mode-both">
          {['Tất cả tài liệu', 'Video Hướng dẫn', 'Code Mẫu', 'Tài liệu PDF', 'Phần mềm'].map((cat, i) => (
            <button 
              key={i}
              className={`px-6 py-3 rounded-full font-bold text-sm shadow-sm transition-all duration-300 hover:-translate-y-1 ${
                i === 0 
                  ? 'bg-[#FF5722] text-white shadow-[#FF5722]/30 shadow-lg' 
                  : 'bg-white text-neutral-600 hover:text-[#005BAA] hover:shadow-md border border-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {guides.map((guide, i) => {
            const Icon = guide.icon;
            return (
              <div 
                key={guide.id} 
                className={`group bg-white rounded-2xl p-8 shadow-sm border border-neutral-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 cursor-pointer flex flex-col h-full animate-in slide-in-from-bottom-8 fill-mode-both ${guide.border}`}
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-6 mb-6">
                  <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${guide.bg} ${guide.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-xl text-neutral-800 leading-tight group-hover:text-[#005BAA] transition-colors">
                    {guide.title}
                  </h3>
                </div>
                
                <p className="text-neutral-500 text-base leading-relaxed mb-8 flex-1">
                  {guide.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-neutral-50">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-[#FF5722] transition-colors">
                    {guide.type === 'video' ? 'Video (15:20)' : guide.type === 'document' ? 'PDF - 4.2MB' : guide.type === 'code' ? 'ZIP - 1.2MB' : 'Windows/Mac'}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-[#005BAA] transition-colors duration-300">
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Premium Need Help Section */}
        <div className="mt-24 relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[2.5rem] p-10 md:p-16 border border-neutral-700 text-center max-w-4xl mx-auto shadow-2xl animate-in fade-in duration-1000 delay-500 fill-mode-both">
          {/* Subtle glowing effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#FF5722]/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <LifeBuoy className="w-10 h-10 text-[#FF5722]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Bạn vẫn cần hỗ trợ?</h2>
            <p className="text-neutral-300 mb-10 max-w-2xl mx-auto text-lg font-medium">
              Đội ngũ chuyên gia từ RoboEd luôn sẵn sàng đồng hành cùng bạn giải quyết mọi vấn đề kỹ thuật trong thời gian sớm nhất.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-[#FF5722] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#E64A19] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,87,34,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current"><path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" /></svg>
                Chat Zalo Ngay
              </button>
              <button className="bg-white/10 text-white backdrop-blur-sm border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                Gửi Ticket Hỗ Trợ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
