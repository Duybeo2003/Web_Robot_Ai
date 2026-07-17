import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CheckCircle2, Banknote, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.orderId },
    include: {
      items: {
        include: { product: true }
      }
    }
  })

  if (!order) {
    notFound()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  const isBankTransfer = order.paymentMethod === "BANK_TRANSFER"

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center bg-background min-h-[80vh] justify-center">
      <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6 border border-secondary/20">
        <CheckCircle2 className="w-10 h-10" strokeWidth={1.5} />
      </div>
      
      <h1 className="text-4xl font-heading font-bold mb-4 text-foreground tracking-tight">Đặt hàng thành công</h1>
      <p className="text-muted-foreground mb-10 text-center max-w-md text-lg leading-relaxed">
        Mã đơn hàng của bạn là <span className="font-mono font-bold text-foreground">#{order.id.slice(-8).toUpperCase()}</span>.
        Chúng tôi sẽ sớm liên hệ để xác nhận đơn hàng.
      </p>

      {/* Bank Transfer Instructions */}
      {isBankTransfer && (
        <div className="w-full max-w-lg bg-card border border-border rounded-sm p-8 mb-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-foreground border-b border-border/50 pb-4">
            <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <h2 className="text-2xl font-heading font-bold">Hướng dẫn chuyển khoản</h2>
          </div>
          
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span>Ngân hàng:</span>
              <span className="font-semibold text-foreground">Vietcombank</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span>Chủ tài khoản:</span>
              <span className="font-semibold text-foreground">CTY ROBOED</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span>Số tài khoản:</span>
              <span className="font-bold text-lg text-foreground">0123456789</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span>Số tiền:</span>
              <span className="font-bold text-primary text-lg">{formatPrice(Number(order.totalAmount))}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span>Nội dung (Bắt buộc):</span>
              <span className="font-bold text-foreground font-mono bg-muted px-2 py-1 rounded-sm tracking-wider">ROBOED {order.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-8 text-center bg-muted/50 p-4 rounded-sm">
            Đơn hàng sẽ được xử lý ngay sau khi hệ thống (hoặc Admin) xác nhận nhận được thanh toán.
          </p>
        </div>
      )}

      {/* COD Instructions */}
      {!isBankTransfer && (
        <div className="w-full max-w-lg bg-card border border-border rounded-sm p-8 mb-10 text-center shadow-sm">
          <div className="flex items-center justify-center gap-3 mb-4 text-foreground">
            <Banknote className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <h2 className="text-2xl font-heading font-bold">Thanh toán khi nhận hàng (COD)</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Vui lòng chuẩn bị số tiền <strong className="text-foreground">{formatPrice(Number(order.totalAmount))}</strong> khi nhân viên giao hàng liên hệ.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/shop">
          <Button variant="outline" className="rounded-sm h-12 px-6">Tiếp tục mua sắm</Button>
        </Link>
        <Link href="/portal/orders">
          <Button className="rounded-sm h-12 px-6 gap-2">Theo dõi đơn hàng <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Link>
      </div>
    </div>
  )
}
