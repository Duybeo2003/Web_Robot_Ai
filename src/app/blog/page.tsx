import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, User } from "lucide-react"

export const metadata = {
  title: "Blog & Kiến Thức STEM - RoboEd",
  description: "Cập nhật những kiến thức mới nhất về giáo dục STEM, lập trình Robot và tư duy logic cho trẻ.",
}

export default async function BlogPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true }
      }
    }
  })

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen bg-background">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground mb-4">
          Blog & Kiến Thức STEM
        </h1>
        <p className="text-muted-foreground text-lg">
          Những bài viết, hướng dẫn và kiến thức bổ ích giúp con bạn làm quen với công nghệ và tư duy lập trình từ sớm.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>Chưa có bài viết nào được xuất bản.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group flex flex-col bg-white rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
              {/* Thumbnail Placeholder if no image */}
              <div className="aspect-[16/9] w-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                <div className="text-neutral-300 font-bold text-3xl group-hover:scale-110 transition-transform duration-500">
                  ROBOED
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-bold font-heading mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h2>
                
                {article.content && (
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                    {/* Extract a bit of plain text from the content to use as description */}
                    {article.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{article.author?.name || "RoboEd Team"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(article.createdAt), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
