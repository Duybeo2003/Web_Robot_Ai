import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { InventoryTable } from "./components/inventory-table"
import { LowStockTable } from "./components/low-stock-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Quản lý Kho hàng - Admin",
  description: "Quản lý nhập xuất kho hàng",
}

export default async function AdminInventoryPage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STORE_MANAGER")) {
    redirect("/")
  }

  // Fetch quick stats
  const totalProducts = await prisma.product.count({
    where: { deletedAt: null }
  })

  const lowStockCount = await prisma.product.count({
    where: { 
      inventoryCount: { lte: 10 },
      deletedAt: null
    }
  })

  const recentTransactions = await prisma.inventoryTransaction.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: { title: true, sku: true, imageUrl: true }
      },
      user: {
        select: { name: true, email: true }
      }
    }
  })

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Kho hàng</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý nhập/xuất kho và theo dõi tồn kho.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/inventory/new-po" />} className="bg-blue-600 hover:bg-blue-700">
            Tạo Phiếu Nhập Kho
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Tổng sản phẩm kinh doanh</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Các mặt hàng đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/60 shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Sắp hết hàng (Low Stock)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sản phẩm có tồn kho &lt;= 10
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-neutral-200/60 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Lịch sử Nhập/Xuất kho</CardTitle>
              <CardDescription>50 giao dịch gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable transactions={recentTransactions} />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="border-neutral-200/60 shadow-sm border-t-4 border-t-red-500 h-full">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cảnh báo hết hàng
              </CardTitle>
              <CardDescription>Sản phẩm cần nhập thêm</CardDescription>
            </CardHeader>
            <CardContent>
              <LowStockTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
