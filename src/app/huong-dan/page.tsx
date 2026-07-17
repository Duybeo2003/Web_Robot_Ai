import Link from "next/link";
import { BookOpen, FileText, ChevronRight, Download } from "lucide-react";

export const metadata = {
  title: "Hướng dẫn sử dụng - RoboEd",
  description: "Tài liệu và hướng dẫn sử dụng các dòng Robot giáo dục và Kit STEM.",
};

const manuals = [
  {
    id: 1,
    title: "Hướng dẫn lắp ráp Robot mBot cơ bản",
    category: "Robot STEM",
    date: "12/07/2026",
  },
  {
    id: 2,
    title: "Cài đặt phần mềm mBlock 5 cho người mới",
    category: "Phần mềm",
    date: "10/07/2026",
  },
  {
    id: 3,
    title: "Tài liệu lập trình Arduino từ A-Z (PDF)",
    category: "Kit Arduino",
    date: "05/07/2026",
  },
  {
    id: 4,
    title: "Cách kết nối Robot với điện thoại qua Bluetooth",
    category: "Kết nối",
    date: "01/07/2026",
  },
];

export default function UserManualsPage() {
  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-neutral-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-[#FF5722] mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-2 uppercase tracking-tight">HƯỚNG DẪN SỬ DỤNG</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Tổng hợp các tài liệu, sách hướng dẫn lắp ráp và lập trình cho tất cả các dòng sản phẩm giáo dục tại RoboEd.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100 sticky top-24">
            <h3 className="font-bold text-lg mb-4 text-neutral-800 border-b pb-2">Danh mục tài liệu</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-neutral-600 hover:text-[#FF5722] flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#FF5722]" /> Robot STEM
                </Link>
              </li>
              <li>
                <Link href="#" className="text-neutral-600 hover:text-[#FF5722] flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#FF5722]" /> Kit Arduino
                </Link>
              </li>
              <li>
                <Link href="#" className="text-neutral-600 hover:text-[#FF5722] flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#FF5722]" /> Lập trình Scratch/mBlock
                </Link>
              </li>
              <li>
                <Link href="#" className="text-neutral-600 hover:text-[#FF5722] flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 mr-2 text-[#FF5722]" /> Đồ chơi Logic 3D
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          <div className="bg-white rounded-sm shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-bold text-xl text-neutral-800">Mới cập nhật</h2>
            </div>
            
            <div className="divide-y divide-neutral-100">
              {manuals.map((manual) => (
                <div key={manual.id} className="p-6 hover:bg-neutral-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#FFF0EB] p-3 rounded-full text-[#FF5722] group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-neutral-800 group-hover:text-[#FF5722] transition-colors mb-1">
                        {manual.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
                        <span className="bg-neutral-100 px-2 py-0.5 rounded-sm">{manual.category}</span>
                        <span>Cập nhật: {manual.date}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-[#0066FF] text-sm font-semibold flex items-center gap-1 hover:underline whitespace-nowrap">
                    <Download className="w-4 h-4" /> Tải về
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
