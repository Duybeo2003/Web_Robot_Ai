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
import { deleteCategory } from "@/actions/admin"
import { toast } from "sonner"
import { useState } from "react"
import { CategoryForm } from "./category-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function CategoryActions({ category }: { category: { id: string, name: string, description: string | null } }) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return
    setIsLoading(true)
    const result = await deleteCategory(category.id)
    setIsLoading(false)
    if (result.success) {
      toast.success("Đã xóa danh mục")
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-end gap-2">
          <DialogTrigger className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="Sửa">
            <Edit className="w-4 h-4" />
          </DialogTrigger>
          <button 
            onClick={handleDelete} 
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50" 
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Danh mục</DialogTitle>
          </DialogHeader>
          <CategoryForm initialData={category} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
