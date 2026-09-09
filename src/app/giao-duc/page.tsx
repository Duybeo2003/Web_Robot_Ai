import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Góc giáo dục STEM - RoboEQ",
  description: "Các bài viết hướng dẫn, kiến thức về Arduino, Robot và STEM",
  openGraph: {
    title: "Góc giáo dục STEM - RoboEQ",
    description: "Các bài viết hướng dẫn, kiến thức về Arduino, Robot và STEM",
  },
};

export default async function EducationBlogPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
    },
  });

  return (
    <main className="container mx-auto min-h-screen px-4 py-10 sm:py-14">
      <div className="mb-10 text-center sm:mb-12">
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          Góc giáo dục STEM
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Tổng hợp các bài viết hướng dẫn, thủ thuật và kiến thức bổ ích về lập
          trình Arduino, chế tạo Robot và giáo dục STEM.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.length === 0 ? (
          <div className="col-span-full text-center py-20 text-neutral-500">
            Chưa có bài viết nào được xuất bản.
          </div>
        ) : (
          articles.map((article) => (
            <Link
              key={article.id}
              href={`/giao-duc/${article.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative h-48 w-full bg-neutral-100 overflow-hidden">
                {article.thumbnail ? (
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300 font-heading text-2xl font-bold bg-neutral-100">
                    RoboEQ
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    Kiến thức
                  </span>
                  <span className="text-xs text-neutral-500">
                    {format(new Date(article.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
                <h2 className="mb-3 min-h-[3.5rem] text-xl font-bold text-neutral-900 transition-colors line-clamp-2 group-hover:text-primary">
                  {article.title}
                </h2>
                <p className="text-neutral-600 text-sm line-clamp-3 mb-4 flex-1">
                  {article.content.replace(/<[^>]*>?/gm, "").substring(0, 150)}
                  ...
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100">
                  <span className="text-sm font-medium text-neutral-700">
                    {article.author.name}
                  </span>
                  <span className="text-sm font-bold text-[#FF5722] group-hover:underline">
                    Đọc tiếp <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}







export const dynamic = 'force-dynamic';
