import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react"

export default async function OrdersPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-amber-500" />
      case 'PROCESSING': return <Package className="w-5 h-5 text-blue-500" />
      case 'SHIPPED': return <Truck className="w-5 h-5 text-purple-500" />
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-neutral-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return "Chờ xử lý"
      case 'PROCESSING': return "Đang chuẩn bị hàng"
      case 'SHIPPED': return "Đang giao hàng"
      case 'COMPLETED': return "Đã giao thành công"
      case 'CANCELLED': return "Đã hủy"
      default: return status
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-neutral-100 min-h-[500px]">
      <div className="border-b border-neutral-100 pb-4 mb-6">
        <h1 className="text-xl font-bold text-foreground">Đơn Hàng Của Tôi</h1>
        <p className="text-sm text-neutral-500 mt-1">Quản lý và theo dõi trạng thái các đơn hàng đã đặt</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-neutral-400" />
          </div>
          <p className="text-neutral-500 font-medium mb-2">Chưa có đơn hàng</p>
          <p className="text-sm text-neutral-400">Bạn chưa đặt mua sản phẩm nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-neutral-200 rounded-sm overflow-hidden">
              <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-b border-neutral-200 text-sm">
                <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                  <span className="font-medium text-foreground">Mã ĐH: {order.id.slice(0, 8).toUpperCase()}</span>
                  <span>Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-[#FF5722]">
                  {getStatusIcon(order.status)}
                  <span className="uppercase">{getStatusText(order.status)}</span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-white border border-neutral-100 rounded-sm p-1 shrink-0">
                      {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="w-full h-full object-contain" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">{item.product.title}</h4>
                      <p className="text-xs text-neutral-500 mt-1">x{item.quantity}</p>
                    </div>
                    <div className="text-sm text-[#FF5722] font-medium">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(item.priceAtPurchase))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-t border-neutral-200">
                <span className="text-sm text-neutral-600">Thành tiền:</span>
                <span className="text-lg font-bold text-[#FF5722]">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
