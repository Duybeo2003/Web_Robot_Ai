"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, PackageCheck } from "lucide-react"
import { updateReturnRequestStatus } from "@/actions/rma"
import { useState } from "react"
import { toast } from "sonner"

export function RmaActionDropdown({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (status: "APPROVED" | "REJECTED" | "COMPLETED") => {
    setLoading(true)
    const res = await updateReturnRequestStatus(requestId, status)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Đã cập nhật trạng thái Yêu cầu")
    }
    setLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        render={<Button variant="ghost" className="h-8 w-8 p-0" disabled={loading} />}
      >
        <span className="sr-only">Mở menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus === "PENDING" && (
          <>
            <DropdownMenuItem onClick={() => handleUpdate("APPROVED")} className="cursor-pointer text-blue-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Tiếp nhận (Duyệt)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdate("REJECTED")} className="cursor-pointer text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Từ chối
            </DropdownMenuItem>
          </>
        )}
        {currentStatus === "APPROVED" && (
          <DropdownMenuItem onClick={() => handleUpdate("COMPLETED")} className="cursor-pointer text-green-600">
            <PackageCheck className="mr-2 h-4 w-4" />
            Đã hoàn thành Đổi/Trả
          </DropdownMenuItem>
        )}
        {(currentStatus === "COMPLETED" || currentStatus === "REJECTED") && (
          <DropdownMenuItem disabled>Không có hành động</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
