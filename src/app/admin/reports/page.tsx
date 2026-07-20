import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportsChart } from "./components/reports-chart"
import { format } from "date-fns"

export const metadata: Metadata = {
  title: "Báo cáo Doanh thu - Admin",
  description: "Báo cáo thống kê kinh doanh",
}

export default async function AdminReportsPage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STORE_MANAGER")) {
    redirect("/")
  }

  // Lấy đơn hàng hoàn thành trong 6 tháng gần nhất (mock dữ liệu biểu đồ đơn giản)
  const orders = await prisma.order.findMany({
    where: { 
      status: "COMPLETED",
      deletedAt: null 
    },
    select: {
      totalAmount: true,
      createdAt: true
    },
    orderBy: { createdAt: "asc" }
  })

  // Group by month
  const groupedData: Record<string, number> = {}
  let totalRevenue = 0

  orders.forEach(order => {
    const month = format(new Date(order.createdAt), "MM/yyyy")
    if (!groupedData[month]) {
      groupedData[month] = 0
    }
    const amount = Number(order.totalAmount)
    groupedData[month] += amount
    totalRevenue += amount
  })

  const chartData = Object.keys(groupedData).map(key => ({
    name: key,
    revenue: groupedData[key]
  }))

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight">Báo cáo Doanh thu</h2>
        <p className="text-muted-foreground mt-1">
          Tổng quan tình hình kinh doanh và doanh thu theo tháng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Tổng doanh thu (All time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Từ các đơn hàng đã giao thành công
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-200/60 shadow-sm">
        <CardHeader>
          <CardTitle>Biểu đồ Doanh thu theo tháng</CardTitle>
          <CardDescription>Xu hướng tăng trưởng qua các tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
