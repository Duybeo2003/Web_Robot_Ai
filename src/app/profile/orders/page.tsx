import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CancelOrderButton } from "./components/cancel-order-button"

import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react"
import Image from "next/image"

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

  const renderTimeline = (status: string) => {
    if (status === 'CANCELLED') {
      return (
        <div className="bg-red-50 text-red-600 px-4 py-3 text-sm font-medium flex items-center gap-2 border-b border-red-100">
          <XCircle className="w-5 h-5" />
          Đơn hàng đã bị hủy.
        </div>
      )
    }

    const steps = [
      { key: 'PENDING', label: 'Chờ xử lý', icon: Clock },
      { key: 'PROCESSING', label: 'Đang chuẩn bị', icon: Package },
      { key: 'SHIPPED', label: 'Đang giao', icon: Truck },
      { key: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle }
    ];

    const currentIndex = steps.findIndex(s => s.key === status);
    
    return (
      <div className="px-4 py-6 border-b border-neutral-100 bg-white">
        <div className="relative flex justify-between">
          {/* Progress bar background */}
          <div className="absolute left-[10%] right-[10%] top-4 h-1 bg-neutral-200 -z-0"></div>
          
          {/* Active progress bar */}
          <div 
            className="absolute left-[10%] top-4 h-1 bg-green-500 transition-all duration-500 -z-0"
            style={{ width: `${currentIndex > 0 ? (currentIndex / (steps.length - 1)) * 80 : 0}%` }}
          ></div>

          {steps.map((step, idx) => {
            const isActive = idx <= currentIndex;
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 w-1/4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-neutral-200 text-neutral-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[11px] md:text-xs font-semibold text-center ${isActive ? 'text-green-700' : 'text-neutral-400'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
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
            <div key={order.id} className="border border-neutral-200 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-b border-neutral-200 text-sm">
                <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                  <span className="font-bold text-foreground uppercase tracking-wider text-xs bg-white px-2 py-1 border border-neutral-200 rounded-sm">Mã ĐH: {order.id.slice(0, 8)}</span>
                  <span>Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#FF5722]">
                  {getStatusIcon(order.status)}
                  <span className="uppercase tracking-wider text-xs">{getStatusText(order.status)}</span>
                </div>
              </div>
              
              {/* Timeline Section */}
              {renderTimeline(order.status)}
              
              <div className="p-4 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-white border border-neutral-100 rounded-sm p-1 shrink-0 group">
                      {item.product.imageUrl && (
                        <div className="relative w-full h-full">
                          <Image src={item.product.imageUrl} alt="" fill className="object-contain group-hover:scale-105 transition-transform" sizes="80px" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2 hover:text-[#FF5722] cursor-pointer transition-colors">{item.product.title}</h4>
                      <p className="text-xs text-neutral-500 mt-1">x{item.quantity}</p>
                    </div>
                    <div className="text-sm text-[#FF5722] font-bold">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(item.priceAtPurchase))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-t border-neutral-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-600 font-medium">Thành tiền:</span>
                  <span className="text-xl font-bold text-[#FF5722]">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.totalAmount))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium bg-white border border-neutral-200 text-neutral-600 rounded-sm hover:bg-neutral-50 transition-colors hidden sm:block">
                    Liên hệ Hỗ trợ
                  </button>
                  {order.status === 'PENDING' && (
                    <CancelOrderButton orderId={order.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
