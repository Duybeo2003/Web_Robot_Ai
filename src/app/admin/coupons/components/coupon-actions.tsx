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
import { deleteCoupon } from "@/actions/admin"
import { toast } from "sonner"
import { useState } from "react"
import { CouponForm } from "./coupon-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function CouponActions({ coupon }: { coupon: { id: string, code: string, discountPercent: number, usageLimit: number | null, expiresAt: Date | null } }) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return
    setIsLoading(true)
    const result = await deleteCoupon(coupon.id)
    setIsLoading(false)
    if (result.success) {
      toast.success("Đã xóa mã")
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
            <DialogTitle>Sửa Mã giảm giá</DialogTitle>
          </DialogHeader>
          <CouponForm initialData={coupon} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
