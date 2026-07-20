import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ReactMarkdown from "react-markdown"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug }
  })
  
  if (!article) {
    return { title: "Không tìm thấy bài viết" }
  }

  return {
    title: `${article.title} - RoboEd`,
    description: article.content.substring(0, 160).replace(/<[^>]*>?/gm, ''),
    openGraph: {
      title: article.title,
      description: article.content.substring(0, 160).replace(/<[^>]*>?/gm, ''),
      images: article.thumbnail ? [{ url: article.thumbnail }] : [],
    }
  }
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { name: true } }
    }
  })

  if (!article || !article.published) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
      <Link href="/giao-duc" className="inline-flex items-center text-[#FF5722] hover:underline mb-8 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Góc Giáo Dục
      </Link>

      <article className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {article.thumbnail && (
          <div className="relative w-full h-[400px] bg-neutral-100">
            <Image 
              src={article.thumbnail} 
              alt={article.title} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        )}
        
        <div className="p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-neutral-500">
            <span className="font-bold text-[#FF5722] uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-sm">
              Kiến thức STEM
            </span>
            <span>Đăng ngày: {format(new Date(article.createdAt), "dd/MM/yyyy")}</span>
            <span>Bởi: <span className="font-medium text-neutral-800">{article.author.name}</span></span>
          </div>

          <h1 className="text-4xl md:text-5xl font-heading font-bold text-neutral-900 mb-8 leading-tight">
            {article.title}
          </h1>

          <div className="prose prose-lg prose-orange max-w-none text-neutral-700">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {article.tags && (
            <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-neutral-500 mr-2 flex items-center">Tags:</span>
              {article.tags.split(",").map(tag => (
                <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
