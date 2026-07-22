"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Edit } from "lucide-react"
import { deleteArticle } from "@/actions/article"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"

export function ArticleActions({ articleId }: { articleId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.")) return
    setIsLoading(true)
    const result = await deleteArticle(articleId)
    setIsLoading(false)
    if (result.success) {
      toast.success("Đã xóa bài viết")
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0" disabled={isLoading}>
        <span className="sr-only">Mở menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={`/admin/articles/${articleId}`}>
          <DropdownMenuItem className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            <span>Sửa bài viết</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 cursor-pointer">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Xóa bài viết</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
