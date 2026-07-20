"use client"

import { useEffect, useState } from "react"
import { getLowStockProducts } from "@/actions/inventory"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function LowStockTable() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLowStock = async () => {
      const res = await getLowStockProducts(10)
      if (res.success) {
        setProducts(res.data)
      }
      setLoading(false)
    }
    fetchLowStock()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-6 text-sm text-green-600 font-medium">
        Tuyệt vời! Không có sản phẩm nào sắp hết hàng.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-neutral-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="text-right">Tồn kho</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-2 group">
                  <div className="w-10 h-10 relative bg-white border border-neutral-100 rounded-sm overflow-hidden shrink-0">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-100" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-xs text-muted-foreground">SKU: {p.sku || "N/A"}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="destructive" className="font-bold">
                  {p.inventoryCount}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
