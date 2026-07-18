import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PrismaClient } from "@prisma/client"
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react"
import { RevenueChart } from "@/components/admin/revenue-chart"
import Image from "next/image"
import { subDays, format } from "date-fns"

const prisma = new PrismaClient()

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    totalUsers,
    totalProducts,
    orders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({ 
      where: { 
        status: { not: "CANCELLED" } // Only count non-cancelled
      },
      select: { totalAmount: true, createdAt: true } 
    }),
  ])

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

  // Calculate revenue for the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i)
    return {
      dateObj: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      displayDate: format(d, 'dd/MM'),
      revenue: 0
    }
  })

  orders.forEach(order => {
    const orderDateStr = format(new Date(order.createdAt), 'yyyy-MM-dd')
    const dayMatch = last7Days.find(d => d.dateStr === orderDateStr)
    if (dayMatch) {
      dayMatch.revenue += Number(order.totalAmount)
    }
  })

  const chartData = last7Days.map(d => ({
    date: d.displayDate,
    revenue: d.revenue
  }))

  // Top 5 Products by Sales
  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  })
  
  const topProducts = await Promise.all(
    topProductsRaw.map(async (p) => {
      const product = await prisma.product.findUnique({ where: { id: p.productId } })
      return {
        id: product?.id,
        title: product?.title,
        price: product?.price,
        imageUrl: product?.imageUrl,
        sold: p._sum.quantity || 0
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan</h2>
        <p className="text-muted-foreground">Theo dõi hoạt động kinh doanh của cửa hàng.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* ... Metric Cards ... */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-white to-stone-50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-16 h-16 text-[#C86B5A]" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Doanh thu</CardTitle>
            <div className="w-8 h-8 rounded-full bg-[#C86B5A]/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#C86B5A]" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-stone-800 tracking-tight">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue)}
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Đang hoạt động tốt
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-white to-stone-50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <ShoppingCart className="w-16 h-16 text-[#4285F4]" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Đơn hàng</CardTitle>
            <div className="w-8 h-8 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-[#4285F4]" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-stone-800 tracking-tight">+{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Đơn hàng mới trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-white to-stone-50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-16 h-16 text-[#34A853]" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Khách hàng</CardTitle>
            <div className="w-8 h-8 rounded-full bg-[#34A853]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#34A853]" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-stone-800 tracking-tight">+{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-white to-stone-50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Package className="w-16 h-16 text-[#FBBC05]" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Sản phẩm</CardTitle>
            <div className="w-8 h-8 rounded-full bg-[#FBBC05]/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-[#FBBC05]" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-stone-800 tracking-tight">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Sản phẩm đang được bày bán</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Top Sản Phẩm Bán Chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topProducts.length === 0 ? (
                <p className="text-sm text-neutral-500">Chưa có dữ liệu bán hàng.</p>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-sm p-1 shrink-0">
                      {product.imageUrl && (
                        <div className="relative w-full h-full">
                          <Image src={product.imageUrl} alt="" fill className="object-contain" sizes="40px" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">Đã bán: <span className="font-bold text-[#FF5722]">{product.sold}</span> chiếc</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
