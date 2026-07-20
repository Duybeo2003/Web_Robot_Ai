"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Loader2 } from "lucide-react"
import { createReturnRequest } from "@/actions/rma"

export function RmaButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (reason.length < 10) {
      setError("Lý do đổi trả quá ngắn.")
      return
    }

    setLoading(true)
    setError("")
    const res = await createReturnRequest({ orderId, reason })
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setOpen(false)
      setReason("")
      setLoading(false)
      alert("Đã gửi yêu cầu đổi trả thành công. Chúng tôi sẽ liên hệ lại sớm nhất.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={<Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-white" />}
      >
        Yêu cầu Đổi/Trả
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            Yêu cầu Đổi/Trả hàng
          </DialogTitle>
          <DialogDescription>
            Vui lòng nhập lý do bạn muốn đổi/trả đơn hàng này. Nếu có sản phẩm lỗi, hãy mô tả chi tiết.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <Textarea 
            placeholder="Lý do (ít nhất 10 ký tự)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Gửi Yêu Cầu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
