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

const prisma = new PrismaClient()

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sản phẩm</h2>
        <p className="text-muted-foreground">Quản lý danh sách sản phẩm của cửa hàng.</p>
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
                    <Badge variant="outline">{product.categoryId || "Chưa phân loại"}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price))}
                  </TableCell>
                  <TableCell>{product.inventoryCount}</TableCell>
                  <TableCell>
                    <Badge variant={product.inventoryCount > 0 ? "default" : "destructive"}>
                      {product.inventoryCount > 0 ? "Còn hàng" : "Hết hàng"}
                    </Badge>
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
