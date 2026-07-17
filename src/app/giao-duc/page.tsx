import Link from "next/link";
import Image from "next/image";
import { Lightbulb, ChevronRight, Clock } from "lucide-react";

export const metadata = {
  title: "Bài viết giáo dục - RoboEd",
  description: "Các bài viết chia sẻ kinh nghiệm, giáo dục STEM và lập trình cho trẻ em.",
};

const articles = [
  {
    id: 1,
    title: "Tại sao trẻ em nên học STEM từ sớm?",
    excerpt: "Giáo dục STEM (Khoa học, Công nghệ, Kỹ thuật, Toán học) giúp trẻ phát triển tư duy logic và kỹ năng giải quyết vấn đề vượt trội trong tương lai.",
    category: "Kiến thức STEM",
    date: "15/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Top 5 Robot lập trình tốt nhất cho học sinh cấp 1",
    excerpt: "Đánh giá chi tiết các dòng Robot giáo dục dễ học, dễ lập trình bằng kéo thả khối lệnh (Scratch) phù hợp cho các bé từ 6-10 tuổi.",
    category: "Review Sản Phẩm",
    date: "12/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1535303311164-664fc9ec6532?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Làm quen với vi điều khiển Arduino: Bắt đầu từ đâu?",
    excerpt: "Hướng dẫn từng bước cho người mới làm quen với Arduino. Từ cách chuẩn bị linh kiện đến viết đoạn code nháy đèn LED đầu tiên.",
    category: "Kinh nghiệm thực hành",
    date: "08/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abf0ceb6?q=80&w=800&auto=format&fit=crop"
  },
];

export default function EducationArticlesPage() {
  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-neutral-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <Lightbulb className="w-12 h-12 text-[#FF5722] mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-2 uppercase tracking-tight">Kinh Nghiệm & Giáo Dục</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Góc chia sẻ kiến thức, tài liệu học tập và những phương pháp giáo dục STEM hiện đại nhất dành cho phụ huynh và giáo viên.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-sm shadow-sm border border-neutral-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow group">
                <Link href="#" className="relative h-48 w-full overflow-hidden block">
                  <Image 
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-[#FF5722] text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm">
                    {article.category}
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center text-xs text-neutral-400 mb-2">
                    <Clock className="w-3 h-3 mr-1" /> {article.date}
                  </div>
                  <Link href="#">
                    <h3 className="font-bold text-lg text-neutral-800 mb-2 line-clamp-2 group-hover:text-[#FF5722] transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-neutral-500 line-clamp-3 mb-4 flex-1">
                    {article.excerpt}
                  </p>
                  <Link href="#" className="text-[#0066FF] text-sm font-semibold flex items-center hover:underline mt-auto">
                    Đọc tiếp <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100 sticky top-24">
            <h3 className="font-bold text-lg mb-4 text-neutral-800 border-b pb-2">Chủ đề nổi bật</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-sm hover:bg-[#FF5722] hover:text-white cursor-pointer transition-colors">Khoa học</span>
              <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-sm hover:bg-[#FF5722] hover:text-white cursor-pointer transition-colors">Công nghệ</span>
              <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-sm hover:bg-[#FF5722] hover:text-white cursor-pointer transition-colors">Kỹ năng mềm</span>
              <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-sm hover:bg-[#FF5722] hover:text-white cursor-pointer transition-colors">Lập trình Scratch</span>
              <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-sm hover:bg-[#FF5722] hover:text-white cursor-pointer transition-colors">Linh kiện</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
