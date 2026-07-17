"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { updateOrderStatus } from "@/actions/admin"

export function OrderStatusUpdater({ 
  orderId, 
  currentStatus, 
  paymentStatus 
}: { 
  orderId: string, 
  currentStatus: string,
  paymentStatus: string 
}) {
  const [status, setStatus] = useState(currentStatus)
  const [payStatus, setPayStatus] = useState(paymentStatus)
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    setStatus(newStatus)
    try {
      const res = await updateOrderStatus(orderId, { status: newStatus })
      if (res.success) {
        toast.success("Cập nhật trạng thái thành công")
      } else {
        toast.error("Lỗi cập nhật trạng thái")
        setStatus(currentStatus) // revert
      }
    } catch (e) {
      toast.error("Đã xảy ra lỗi")
      setStatus(currentStatus)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentChange = async (newPayStatus: string) => {
    setLoading(true)
    setPayStatus(newPayStatus)
    try {
      const res = await updateOrderStatus(orderId, { paymentStatus: newPayStatus })
      if (res.success) {
        toast.success("Cập nhật thanh toán thành công")
      } else {
        toast.error("Lỗi cập nhật thanh toán")
        setPayStatus(paymentStatus) // revert
      }
    } catch (e) {
      toast.error("Đã xảy ra lỗi")
      setPayStatus(paymentStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={status} onValueChange={(val) => handleStatusChange(val as string)} disabled={loading}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Trạng thái đơn" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Chờ xử lý</SelectItem>
          <SelectItem value="PROCESSING">Đang chuẩn bị</SelectItem>
          <SelectItem value="SHIPPED">Đang giao</SelectItem>
          <SelectItem value="COMPLETED">Đã giao thành công</SelectItem>
          <SelectItem value="CANCELLED">Đã hủy</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={payStatus} onValueChange={(val) => handlePaymentChange(val as string)} disabled={loading}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Thanh toán" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
          <SelectItem value="PAID">Đã thanh toán</SelectItem>
          <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
