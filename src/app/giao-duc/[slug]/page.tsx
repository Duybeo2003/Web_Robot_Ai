import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug, published: true },
  });

  if (!article) {
    return { title: "Không tìm thấy bài viết" };
  }

  return {
    title: `${article.title} - RoboEQ`,
    description: article.content.substring(0, 160).replace(/<[^>]*>?/gm, ""),
    openGraph: {
      title: article.title,
      description: article.content.substring(0, 160).replace(/<[^>]*>?/gm, ""),
      images: article.thumbnail ? [{ url: article.thumbnail }] : [],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
    },
  });

  if (!article || !article.published) {
    notFound();
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl px-4 py-10 sm:py-12">
      <Link
        href="/giao-duc"
        className="inline-flex items-center text-[#FF5722] hover:underline mb-8 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại góc giáo dục
      </Link>

      <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {article.thumbnail && (
          <div className="relative h-60 w-full bg-neutral-100 sm:h-80 md:h-[400px]">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              sizes="(max-width: 1023px) 100vw, 960px"
              className="object-cover"
              preload
            />
          </div>
        )}

        <div className="p-5 sm:p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-neutral-500">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
              Kiến thức STEM
            </span>
            <span>
              Đăng ngày: {format(new Date(article.createdAt), "dd/MM/yyyy")}
            </span>
            <span>
              Bởi:{" "}
              <span className="font-medium text-neutral-800">
                {article.author.name}
              </span>
            </span>
          </div>

          <h1 className="mb-8 text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl md:text-5xl">
            {article.title}
          </h1>

          <div className="prose prose-lg prose-orange max-w-none text-neutral-700">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {article.tags && (
            <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-neutral-500 mr-2 flex items-center">
                Chủ đề:
              </span>
              {article.tags.split(",").map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </main>
  );
}




export const dynamic = "force-dynamic";
