"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Eye, MapPin, Phone, CreditCard, Calendar, ShoppingBag } from "lucide-react"
import { OrderStatusUpdater } from "../order-status-updater"
import { format } from "date-fns"

export function OrderDetailsModal({ order }: { order: any }) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0" title="Xem chi tiết">
        <span className="sr-only">Xem chi tiết</span>
        <Eye className="h-4 w-4 text-blue-500" />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Chi tiết Đơn hàng</SheetTitle>
          <SheetDescription>
            Mã ĐH: <span className="font-mono text-foreground font-medium">{order.id.toUpperCase()}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status Updater */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4 border">
            <h4 className="text-sm font-semibold">Cập nhật trạng thái</h4>
            <OrderStatusUpdater 
              orderId={order.id} 
              currentStatus={order.status} 
              paymentStatus={order.paymentStatus} 
            />
          </div>

          {/* Customer Info */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md"><Phone className="h-4 w-4 text-primary" /></span>
              Thông tin liên hệ
            </h4>
            <div className="pl-9 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Tên:</strong> {order.user.name || "Khách"}</p>
              <p><strong className="text-foreground">SĐT:</strong> {order.receiverPhone || order.user.phoneNumber}</p>
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md"><MapPin className="h-4 w-4 text-primary" /></span>
              Địa chỉ giao hàng
            </h4>
            <p className="pl-9 text-muted-foreground">
              {order.shippingAddress || "Chưa cung cấp"}
            </p>
          </div>

          {/* Payment */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md"><CreditCard className="h-4 w-4 text-primary" /></span>
              Thanh toán
            </h4>
            <div className="pl-9 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Phương thức:</strong> {order.paymentMethod}</p>
              <p><strong className="text-foreground">Ngày đặt:</strong> {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md"><ShoppingBag className="h-4 w-4 text-primary" /></span>
              Sản phẩm ({order.items.length})
            </h4>
            <div className="space-y-3 pl-9">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 pr-4">
                    <p className="font-medium leading-snug">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">SL: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[#FF5722] shrink-0">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(item.priceAtPurchase) * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-primary/20">
                <p className="font-bold text-base">Tổng tiền:</p>
                <p className="font-bold text-xl text-[#FF5722]">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.totalAmount))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
