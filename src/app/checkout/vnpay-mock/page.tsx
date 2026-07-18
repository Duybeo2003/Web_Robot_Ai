"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { processVNPayMock } from "@/actions/checkout"
import { Loader2, ShieldCheck, CreditCard } from "lucide-react"

export function VNPayMockPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("orderId")
  const amount = searchParams.get("amount")
  
  const [loading, setLoading] = useState(false)

  if (!orderId || !amount) return null

  const handlePayment = async () => {
    setLoading(true)
    const res = await processVNPayMock(orderId)
    if (res.success) {
      router.push(`/checkout/success/${orderId}`)
    } else {
      alert("Lỗi thanh toán")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-[#005BAA] p-6 text-white text-center">
          <h1 className="text-2xl font-bold tracking-wider">VNPAY</h1>
          <p className="text-blue-200 text-sm mt-1">Cổng thanh toán giả lập (Mock)</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
            <span className="text-gray-500">Mã đơn hàng:</span>
            <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
          
          <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
            <span className="text-gray-500">Số tiền thanh toán:</span>
            <span className="text-xl font-bold text-[#E30019]">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount))}
            </span>
          </div>

          <div className="bg-blue-50 p-4 rounded-md flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Đây là trang giả lập. Trong thực tế, khách hàng sẽ quét mã QR hoặc nhập thẻ ATM nội địa tại đây.
            </p>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full h-12 bg-[#005BAA] hover:bg-[#004A8B] text-lg font-semibold"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {loading ? "Đang xử lý..." : "Xác Nhận Thanh Toán (Thành Công)"}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => router.push(`/profile/orders`)}
            disabled={loading}
            className="w-full text-gray-500"
          >
            Huỷ và quay lại
          </Button>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-4 h-4" /> Được bảo vệ bởi VNPay Mock
        </div>
      </div>
    </div>
  )
}

import { Suspense } from "react"
export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <VNPayMockPage />
    </Suspense>
  )
}
