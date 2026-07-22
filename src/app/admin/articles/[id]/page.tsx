import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ArticleForm } from "../new/components/article-form"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Sửa bài viết - Admin",
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/")
  }

  const article = await prisma.article.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!article) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/articles" className="p-2 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Sửa bài viết</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-sm border border-neutral-200 shadow-sm">
        <ArticleForm initialData={article} articleId={article.id} />
      </div>
    </div>
  )
}
