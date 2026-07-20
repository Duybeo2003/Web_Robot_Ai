import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"

export const metadata: Metadata = {
  title: "Góc Giáo Dục STEM - RoboEd",
  description: "Các bài viết hướng dẫn, kiến thức về Arduino, Robot và STEM",
  openGraph: {
    title: "Góc Giáo Dục STEM - RoboEd",
    description: "Các bài viết hướng dẫn, kiến thức về Arduino, Robot và STEM",
  }
}

export default async function EducationBlogPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } }
    }
  })

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-4 tracking-tight">Góc Giáo Dục STEM</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Tổng hợp các bài viết hướng dẫn, thủ thuật và kiến thức bổ ích về lập trình Arduino, chế tạo Robot và giáo dục STEM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.length === 0 ? (
          <div className="col-span-full text-center py-20 text-neutral-500">
            Chưa có bài viết nào được xuất bản.
          </div>
        ) : (
          articles.map(article => (
            <Link key={article.id} href={`/giao-duc/${article.slug}`} className="group flex flex-col bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative h-48 w-full bg-neutral-100 overflow-hidden">
                {article.thumbnail ? (
                  <Image src={article.thumbnail} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300 font-heading text-2xl font-bold bg-neutral-100">
                    RoboEd
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF5722] bg-orange-50 px-2 py-1 rounded-sm">
                    Kiến thức
                  </span>
                  <span className="text-xs text-neutral-500">
                    {format(new Date(article.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-neutral-900 mb-3 group-hover:text-[#FF5722] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-neutral-600 text-sm line-clamp-3 mb-4 flex-1">
                  {article.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100">
                  <span className="text-sm font-medium text-neutral-700">{article.author.name}</span>
                  <span className="text-sm font-bold text-[#FF5722] group-hover:underline">Đọc tiếp &rarr;</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
