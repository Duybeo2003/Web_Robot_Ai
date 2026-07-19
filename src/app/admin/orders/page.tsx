import { PrismaClient } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { OrderDetailsModal } from "./components/order-details-modal"
import { Card } from "@/components/ui/card"

const prisma = new PrismaClient()

const paymentStatusMap: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
}

const getOrderStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent">Chờ xử lý</Badge>
    case 'PROCESSING': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent">Đang chuẩn bị</Badge>
    case 'SHIPPED': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-transparent">Đang giao</Badge>
    case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 shadow-none border-transparent">Đã giao thành công</Badge>
    case 'CANCELLED': return <Badge variant="destructive">Đã hủy</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      items: {
        include: { product: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Đơn hàng</h2>
        <p className="text-muted-foreground">Quản lý và cập nhật trạng thái đơn hàng.</p>
      </div>
      
      <Card className="rounded-xl border shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">Mã ĐH</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Không có đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                // Serialize Decimal/Date for client component
                const serializedOrder = {
                  ...order,
                  totalAmount: Number(order.totalAmount),
                  createdAt: order.createdAt.toISOString(),
                  updatedAt: order.updatedAt.toISOString(),
                  items: order.items.map((item) => ({
                    ...item,
                    priceAtPurchase: Number(item.priceAtPurchase),
                    product: {
                      ...item.product,
                      price: Number(item.product.price),
                      originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
                    },
                  })),
                }
                return (
                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-medium">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.user.name || "Khách"}</span>
                      <span className="text-xs text-muted-foreground">{order.receiverPhone || order.user.phoneNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="font-semibold text-[#FF5722]">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.totalAmount))}
                  </TableCell>
                  <TableCell>
                    {order.paymentStatus === "PAID" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-transparent">Đã thanh toán</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-600 hover:bg-stone-200 border-transparent">Chưa thanh toán</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {getOrderStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderDetailsModal order={serializedOrder} />
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
