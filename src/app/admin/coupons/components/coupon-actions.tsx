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
                  <span>Sửa mã</span>
                </DropdownMenuItem>
              </DialogTrigger>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Xóa mã giảm giá</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
