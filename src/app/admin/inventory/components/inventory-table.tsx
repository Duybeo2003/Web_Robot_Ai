"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

export function InventoryTable({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <p>Chưa có giao dịch xuất/nhập kho nào.</p>
      </div>
    )
  }

  const formatPrice = (price: any) => {
    if (!price) return "-"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price))
  }

  return (
    <div className="rounded-md border border-neutral-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead>Ngày GD</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="text-right">Số lượng</TableHead>
            <TableHead className="text-right">Giá vốn (Nhập)</TableHead>
            <TableHead>Tham chiếu</TableHead>
            <TableHead>Người thực hiện</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {tx.type === "IN" ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit gap-1">
                    <ArrowDownRight className="w-3 h-3" /> Nhập kho
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center w-fit gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Xuất kho
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm line-clamp-1">{tx.product.title}</span>
                  <span className="text-xs text-muted-foreground">SKU: {tx.product.sku || "N/A"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-base">
                <span className={tx.type === "IN" ? "text-green-600" : "text-orange-600"}>
                  {tx.type === "IN" ? "+" : "-"}{tx.quantity}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {tx.type === "IN" ? formatPrice(tx.costPrice) : "-"}
              </TableCell>
              <TableCell>
                <span className="text-sm">{tx.reference || "-"}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{tx.user?.name || "System"}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
