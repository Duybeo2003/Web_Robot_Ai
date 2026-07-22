import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Calendar, User, ArrowLeft, Tag } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = await prisma.article.findUnique({
    where: { slug: resolvedParams.slug },
  })

  if (!article) {
    return { title: "Không tìm thấy bài viết" }
  }

  const title = `${article.title} - Blog RoboEd`;
  // Simple plain text extraction for description
  const description = article.content.replace(/<[^>]*>?/gm, '').substring(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    }
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = await prisma.article.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      author: {
        select: { name: true }
      }
    }
  })

  if (!article || !article.published) {
    notFound()
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Article Header */}
      <div className="bg-white border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/blog" className="inline-flex items-center text-sm text-primary hover:underline mb-8 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Blog
          </Link>
          
          <h1 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-foreground leading-tight mb-6">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {article.author?.name?.charAt(0) || "R"}
              </div>
              <span className="font-medium text-foreground">{article.author?.name || "RoboEd Team"}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(article.createdAt), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 max-w-4xl mt-12">
        <article className="prose prose-stone prose-lg max-w-none dark:prose-invert prose-headings:font-heading prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:shadow-md">
          <ReactMarkdown>
            {article.content}
          </ReactMarkdown>
        </article>

        {/* Tags / Footer */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Chia sẻ kiến thức này:</span>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 font-bold">f</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
