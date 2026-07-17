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
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Edit } from "lucide-react"

const prisma = new PrismaClient()

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sản phẩm</h2>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm của cửa hàng.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Thêm Mới
          </Button>
        </Link>
      </div>
      
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã SP</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Không có sản phẩm nào.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-xs text-muted-foreground">{product.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-neutral-50 text-neutral-600">
                      {product.type === 'ROBOT_STEM' ? 'Robot Thông Minh' :
                       product.type === 'KIT_ARDUINO' ? 'Kit Arduino' :
                       product.type === 'DO_CHOI_LOGIC' ? 'Đồ chơi Logic' : 'Khác'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price))}
                  </TableCell>
                  <TableCell>{product.inventoryCount}</TableCell>
                  <TableCell>
                    <Badge className={
                      product.inventoryCount === 0 ? "bg-neutral-300 text-neutral-600" :
                      product.inventoryCount < 5 ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" :
                      "bg-[#FF5722] hover:bg-[#FF5722]/90 text-white"
                    }>
                      {product.inventoryCount === 0 ? "Hết hàng" :
                       product.inventoryCount < 5 ? `Sắp hết (${product.inventoryCount})` : "Còn hàng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-[#FF5722]">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
