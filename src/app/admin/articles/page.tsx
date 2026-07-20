import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Quản lý Bài viết - Admin",
}

export default async function AdminArticlesPage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/")
  }

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } }
    }
  })

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Bài viết & Blog</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý nội dung giáo dục STEM, tin tức và tối ưu SEO.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/articles/new" />} className="bg-[#FF5722] hover:bg-[#E64A19]">
            Viết bài mới
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Chưa có bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-[300px]">
                    <div className="truncate">{article.title}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-1">{article.slug}</div>
                  </TableCell>
                  <TableCell>{article.author.name}</TableCell>
                  <TableCell>
                    {article.published ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Đã xuất bản
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200">
                        Bản nháp
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(article.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" render={<Link href={`/admin/articles/${article.id}`} />}>
                      Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
