import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-16 bg-[#F5F5F5] min-h-[70vh] flex items-center justify-center">
      <div className="bg-white p-8 md:p-12 rounded-sm shadow-xl shadow-green-500/10 border border-green-100 max-w-2xl w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-[#FF5722]"></div>
        
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-30"></div>
          <CheckCircle2 className="w-14 h-14 text-green-600 relative z-10" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-4 uppercase text-[#FF5722]">
          Đặt Hàng Thành Công!
        </h1>
        
        <p className="text-neutral-600 mb-8 max-w-md mx-auto">
          Cảm ơn bạn đã mua sắm tại RoboEd. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao đến bạn.
        </p>

        <div className="bg-neutral-50 border border-neutral-100 p-6 rounded-sm mb-8 text-left">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-200">
            <span className="text-neutral-500 text-sm">Mã đơn hàng</span>
            <span className="font-bold text-foreground">{order.id.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-200">
            <span className="text-neutral-500 text-sm">Phương thức thanh toán</span>
            <span className="font-medium text-foreground">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 text-sm">Tổng thanh toán</span>
            <span className="font-bold text-[#E30019] text-xl">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.totalAmount))}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/profile/orders">
            <Button variant="outline" className="w-full sm:w-auto h-12 px-8 border-neutral-200 text-neutral-700">
              <Package className="w-4 h-4 mr-2" />
              Xem đơn hàng
            </Button>
          </Link>
          <Link href="/shop">
            <Button className="w-full sm:w-auto h-12 px-8 bg-[#FF5722] hover:bg-[#E64A19] text-white">
              Tiếp tục mua sắm
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
