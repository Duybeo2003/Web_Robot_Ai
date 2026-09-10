import {
  BookOpen,
  PlayCircle,
  Code2,
  Download,
  Search,
  Zap,
  LifeBuoy,
} from "lucide-react";
import Link from "next/link";
import { getBusinessIdentity } from "@/lib/commerce-policy";

export const metadata = {
  title: "Hướng dẫn sử dụng & Tài liệu - RoboEQ",
  description:
    "Trung tâm tài liệu, video hướng dẫn lắp ráp và code mẫu cho các sản phẩm Robot STEM, Arduino.",
};

const guides = [
  {
    id: 1,
    title: "Hướng dẫn lắp ráp Robot STEM phiên bản V2",
    description:
      "Video chi tiết các bước lắp ráp khung gầm, đấu nối dây điện và cài đặt pin cho phiên bản V2 mới nhất.",
    type: "video",
    icon: PlayCircle,
    color: "text-rose-500",
    bg: "bg-rose-100/50",
    border: "group-hover:border-rose-200",
  },
  {
    id: 2,
    title: "Mã nguồn mẫu: Dò line và tránh vật cản",
    description:
      "Bộ thư viện và code mẫu Arduino (C++) đã được tinh chỉnh, giúp Robot có thể chạy dò line mượt mà.",
    type: "code",
    icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-100/50",
    border: "group-hover:border-blue-200",
  },
  {
    id: 3,
    title: "Sổ tay sử dụng Kit Arduino Uno R3 cơ bản",
    description:
      "Tài liệu PDF 50 trang hướng dẫn cách cài đặt Arduino IDE, cách nạp code và làm quen với 10 linh kiện cơ bản.",
    type: "document",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-100/50",
    border: "group-hover:border-emerald-200",
  },
  {
    id: 4,
    title: "Phần mềm MBlock 5 (Lập trình kéo thả)",
    description:
      "Tải xuống phần mềm MBlock phiên bản mới nhất hỗ trợ lập trình Scratch cho các dòng Robot dành cho trẻ em.",
    type: "download",
    icon: Download,
    color: "text-purple-500",
    bg: "bg-purple-100/50",
    border: "group-hover:border-purple-200",
  },
];

const categories = [
  { value: "all", label: "Tất cả tài liệu" },
  { value: "video", label: "Video hướng dẫn" },
  { value: "code", label: "Mã nguồn mẫu" },
  { value: "document", label: "Tài liệu PDF" },
  { value: "download", label: "Phần mềm" },
];

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const activeType = categories.some((category) => category.value === params.type)
    ? params.type || "all"
    : "all";
  const normalizedQuery = query.toLocaleLowerCase("vi-VN");
  const filteredGuides = guides.filter(
    (guide) =>
      (activeType === "all" || guide.type === activeType) &&
      (!normalizedQuery ||
        `${guide.title} ${guide.description}`
          .toLocaleLowerCase("vi-VN")
          .includes(normalizedQuery)),
  );
  const business = getBusinessIdentity();
  const supportHref = business.socialLinks.zalo || "/lien-he";

  return (
    <main className="min-h-screen bg-neutral-50 pb-16 selection:bg-primary/20">
      {/* Hero Section with Premium Gradient */}
      <section className="relative overflow-hidden border-b-4 border-primary bg-gradient-to-br from-[#004A8B] via-[#005BAA] to-[#0073D1] py-16 text-center text-white sm:py-20">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-white/10 rotate-12 blur-3xl rounded-full"></div>
          <div className="absolute top-[40%] right-[5%] w-[30%] h-[100%] bg-white/10 -rotate-12 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 animate-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="mb-5 inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] backdrop-blur-md">
            <BookOpen className="size-10 text-white" />
          </div>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight drop-shadow-sm md:text-6xl">
            Trung tâm hướng dẫn
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed mb-10">
            Khám phá tài liệu kỹ thuật, video lắp ráp và mã nguồn lập trình
            chuyên nghiệp để làm chủ các thiết bị từ RoboEQ.
          </p>

          {/* Glassmorphism Search Bar */}
          <form action="/huong-dan" className="group relative mx-auto max-w-2xl">
            <input type="hidden" name="type" value={activeType} />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-orange-400 opacity-25 blur transition duration-500 group-focus-within:opacity-50"></div>
            <div className="relative flex flex-col items-stretch gap-2 rounded-2xl border border-white/30 bg-white/10 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-white/60 focus-within:bg-white/20 sm:flex-row sm:items-center">
              <Search className="ml-4 hidden size-6 shrink-0 text-white/70 sm:block" />
              <input
                name="q"
                type="text"
                defaultValue={query}
                placeholder="Nhập mã sản phẩm hoặc tên linh kiện..."
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-white placeholder-blue-200/70 focus:outline-none sm:text-lg"
              />
              <button type="submit" className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 font-bold text-white shadow-lg transition-colors hover:bg-orange-600">
                <Zap className="w-4 h-4 hidden sm:block" />
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        {/* Categories Pills */}
        <nav className="animate-in mb-8 flex flex-wrap justify-center gap-2 pt-1 zoom-in-95 duration-500 fill-mode-both sm:mb-12" aria-label="Loại tài liệu">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={{ pathname: "/huong-dan", query: { ...(query ? { q: query } : {}), type: category.value } }}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-all duration-300 ${
                activeType === category.value
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-neutral-600 hover:text-[#005BAA] hover:shadow-md border border-neutral-100"
              }`}
            >
              {category.label}
            </Link>
          ))}
        </nav>

        {/* Guides Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {filteredGuides.map((guide, i) => {
            const Icon = guide.icon;
            return (
              <div
                key={guide.id}
                className={`group animate-in flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-500 slide-in-from-bottom-8 fill-mode-both hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/5 sm:p-8 ${guide.border}`}
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-6 mb-6">
                  <div
                    className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${guide.bg} ${guide.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold leading-tight text-neutral-800 transition-colors group-hover:text-[#005BAA]">
                    {guide.title}
                  </h2>
                </div>

                <p className="text-neutral-500 text-base leading-relaxed mb-8 flex-1">
                  {guide.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-neutral-50">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-[#FF5722] transition-colors">
                    {guide.type === "video"
                      ? "Video · 15:20"
                      : guide.type === "document"
                        ? "PDF · 4,2 MB"
                        : guide.type === "code"
                          ? "Tệp ZIP · 1,2 MB"
                          : "Windows / macOS"}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500">Sắp cập nhật</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGuides.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
            <Search className="mx-auto mb-4 size-10 text-neutral-300" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">Chưa tìm thấy tài liệu phù hợp</h2>
            <p className="mt-2 text-sm text-neutral-500">Thử từ khóa ngắn hơn hoặc chọn một loại tài liệu khác.</p>
          </div>
        )}

        {/* Premium Need Help Section */}
        <section className="animate-in relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl border border-neutral-700 bg-gradient-to-br from-neutral-900 to-neutral-800 p-7 text-center shadow-2xl fade-in duration-1000 fill-mode-both sm:p-12 md:p-14">
          {/* Subtle glowing effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#FF5722]/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800 shadow-inner">
              <LifeBuoy className="size-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Bạn vẫn cần hỗ trợ?
            </h2>
            <p className="text-neutral-300 mb-10 max-w-2xl mx-auto text-lg font-medium">
              Đội ngũ chuyên gia từ RoboEQ luôn sẵn sàng đồng hành cùng bạn giải
              quyết mọi vấn đề kỹ thuật trong thời gian sớm nhất.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href={supportHref} target={business.socialLinks.zalo ? "_blank" : undefined} rel={business.socialLinks.zalo ? "noopener noreferrer" : undefined} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-white transition-colors hover:bg-orange-600">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  className="fill-current"
                >
                  <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
                </svg>
                Chat Zalo ngay
              </a>
              <Link href="/lien-he" className="flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                Gửi yêu cầu hỗ trợ
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
