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
import { MoreHorizontal, Trash2 } from "lucide-react"
import { deleteReview } from "@/actions/admin"
import { toast } from "sonner"
import { useState } from "react"

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.")) return
    setIsLoading(true)
    const result = await deleteReview(reviewId)
    setIsLoading(false)
    if (result.success) {
      toast.success("Đã xóa đánh giá")
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
  }

  return (
    <div className="flex items-center justify-end">
      <button 
        onClick={handleDelete} 
        disabled={isLoading}
        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50" 
        title="Xóa đánh giá"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
