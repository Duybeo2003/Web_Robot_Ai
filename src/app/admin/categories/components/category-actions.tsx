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
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Mở menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuSeparator />
              <DialogTrigger className="w-full">
                <DropdownMenuItem className="focus:text-blue-600" onSelect={(e) => e.preventDefault()}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Sửa danh mục</span>
                </DropdownMenuItem>
              </DialogTrigger>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Xóa danh mục</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
