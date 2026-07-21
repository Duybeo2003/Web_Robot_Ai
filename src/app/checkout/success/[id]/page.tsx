import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  
  // Build query with ownership check if user is logged in
  const whereClause: any = { id: resolvedParams.id };
  if (session?.user?.id) {
    whereClause.userId = session.user.id;
  }

  const order = await prisma.order.findFirst({
    where: whereClause,
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

        {order.paymentMethod === 'BANK_TRANSFER' && (
          <div className="bg-orange-50 border border-orange-100 p-6 rounded-sm mb-8 text-left">
            <h2 className="text-lg font-bold text-orange-800 mb-4 text-center">Hướng dẫn chuyển khoản qua VietQR</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
                <img 
                  src={`https://img.vietqr.io/image/vcb-1058744697-compact2.png?amount=${order.totalAmount}&addInfo=ROBOED%20${order.id.toUpperCase()}&accountName=NGUYEN%20QUOC%20DUY`}
                  alt="VietQR Payment"
                  className="w-64 h-64 object-contain"
                />
                <p className="text-center text-xs text-gray-500 mt-2 font-medium">Mở App Ngân hàng bất kỳ để quét mã</p>
              </div>
              
              {/* Manual Transfer Info */}
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-orange-600 font-bold uppercase">Ngân hàng</p>
                  <p className="font-semibold text-gray-800">Vietcombank (VCB)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-orange-600 font-bold uppercase">Chủ tài khoản</p>
                  <p className="font-semibold text-gray-800">NGUYEN QUOC DUY</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-orange-600 font-bold uppercase">Số tài khoản</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-lg tracking-wider text-gray-800">1058744697</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-orange-600 font-bold uppercase">Số tiền</p>
                  <p className="font-bold text-[#E30019] text-xl">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.totalAmount))}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-orange-600 font-bold uppercase">Nội dung chuyển khoản</p>
                  <div className="bg-white border border-orange-200 p-3 rounded-sm font-mono font-bold text-lg text-center text-gray-800">
                    ROBOED {order.id.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-orange-700 mt-6 text-center font-medium bg-orange-100/50 p-3 rounded-sm border border-orange-100">
              Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán. Bạn có thể chụp lại màn hình này để chuyển khoản sau.
            </p>
          </div>
        )}

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
