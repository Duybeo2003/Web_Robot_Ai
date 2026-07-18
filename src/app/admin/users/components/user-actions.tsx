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
import { MoreHorizontal, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react"
import { updateUserRole, deleteUser } from "@/actions/admin"
import { toast } from "sonner"
import { useState } from "react"

export function UserActions({ userId, currentRole }: { userId: string, currentRole: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = async (newRole: "USER" | "ADMIN") => {
    setIsLoading(true)
    const result = await updateUserRole(userId, newRole)
    setIsLoading(false)
    if (result.success) {
      toast.success("Đã cập nhật quyền người dùng")
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa/chặn người dùng này?")) return
    setIsLoading(true)
    const result = await deleteUser(userId)
    setIsLoading(false)
    if (result.success) {
      toast.success("Đã xóa người dùng")
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
        {currentRole === "USER" ? (
          <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")}>
            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
            <span>Thăng cấp Admin</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleRoleChange("USER")}>
            <ShieldAlert className="mr-2 h-4 w-4 text-orange-600" />
            <span>Giáng cấp User</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Xóa người dùng</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
