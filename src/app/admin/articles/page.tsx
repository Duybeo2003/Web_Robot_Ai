import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArticleActions } from "./components/article-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Quản lý bài viết - Admin",
};

export default async function AdminArticlesPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")
  ) {
    redirect("/");
  }

  const itemsPerPage = 20;
  const currentPage = Number(searchParams?.page) || 1;

  const totalCount = await prisma.article.count();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const articles = await prisma.article.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
    },
  });

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">
            Bài viết và blog
          </h2>
          <p className="text-muted-foreground mt-1">
            Quản lý nội dung giáo dục STEM, tin tức và tối ưu SEO.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/articles/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-[#FF5722] hover:bg-[#E64A19]",
            )}
          >
            Viết bài mới
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="hidden md:table-cell">Tác giả</TableHead>
              <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  Chưa có bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="min-w-0 max-w-[300px] font-medium">
                    <div className="truncate">{article.title}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-1">
                      {article.slug}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground md:hidden">
                      <span>{article.author.name}</span>
                      <Badge variant="outline" className={article.published ? "border-green-200 bg-green-50 text-green-700" : "border-neutral-200 bg-neutral-50 text-neutral-700"}>
                        {article.published ? "Đã xuất bản" : "Bản nháp"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{article.author.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {article.published ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Đã xuất bản
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-neutral-50 text-neutral-700 border-neutral-200"
                      >
                        Bản nháp
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap lg:table-cell">
                    {format(new Date(article.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ArticleActions articleId={article.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages} (Tổng: {totalCount})
            </p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link href={`?page=${currentPage - 1}`}>
                  <Button variant="outline" size="sm">← Trước</Button>
                </Link>
              )}
              {currentPage < totalPages && (
                <Link href={`?page=${currentPage + 1}`}>
                  <Button variant="outline" size="sm">Sau →</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
