import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ArticleForm } from "./components/article-form"

export const metadata: Metadata = {
  title: "Viết bài mới - Admin",
}

export default async function NewArticlePage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/")
  }

  return (
    <div className="flex-1 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/articles" className="p-2 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Viết bài mới</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-sm border border-neutral-200 shadow-sm">
        <ArticleForm />
      </div>
    </div>
  )
}
