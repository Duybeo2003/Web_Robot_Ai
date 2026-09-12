export const dynamic = "force-dynamic";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ArticleForm } from "./components/article-form";

export const metadata: Metadata = {
  title: "Viết bài mới - Admin",
};

export default async function NewArticlePage() {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")
  ) {
    redirect("/");
  }

  return (
    <div className="flex-1 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/articles"
          className="rounded-lg border border-neutral-200 bg-white p-2 transition-colors hover:bg-neutral-50"
          aria-label="Quay lại danh sách bài viết"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight sm:text-3xl">
            Viết bài mới
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <ArticleForm />
      </div>
    </div>
  );
}
