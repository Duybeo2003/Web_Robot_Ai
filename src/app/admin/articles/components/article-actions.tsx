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
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/articles/${articleId}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="Sửa">
        <Edit className="w-4 h-4" />
      </Link>
      <button 
        onClick={handleDelete} 
        disabled={isLoading}
        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50" 
        title="Xóa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
