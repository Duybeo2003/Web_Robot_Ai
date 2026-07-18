"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cancelOrder } from "@/actions/checkout"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    setLoading(true)
    const res = await cancelOrder(orderId)
    if (res.success) {
      toast.success("Hủy đơn hàng thành công")
    } else {
      toast.error(res.error || "Có lỗi xảy ra")
    }
    setLoading(false)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCancel}
      disabled={loading}
      className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
      Hủy đơn hàng
    </Button>
  )
}
