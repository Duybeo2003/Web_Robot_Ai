"use client";

import { useEffect, useState } from "react";
import { getLowStockProducts } from "@/actions/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type LowStockItem = {
  id: string;
  productId: string;
  title: string;
  sku: string | null;
  imageUrl: string | null;
  inventoryCount: number;
  variantLabel: string | null;
};

export function LowStockTable() {
  const [products, setProducts] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await getLowStockProducts(10);
        if (res.success) {
          setProducts(res.data || []);
        } else {
          setError("Không thể tải danh sách sản phẩm sắp hết hàng");
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu tồn kho");
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  if (error) {
    return (
      <div className="text-center p-6 text-sm text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-6 text-sm text-green-600 font-medium">
        Tuyệt vời! Không có sản phẩm nào sắp hết hàng.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <Table className="table-fixed">
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="w-16 px-2 text-right sm:w-20 sm:px-4">Tồn kho</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="min-w-0 pr-1 sm:pr-4">
                <Link
                  href={`/admin/products/${p.productId}`}
                  className="group flex min-w-0 items-center gap-2"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-white">
                    <Package className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-neutral-300" aria-hidden="true" />
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl}
                        alt={p.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium transition-colors group-hover:text-blue-600">
                      {p.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      SKU: {p.sku || "Chưa cập nhật"}
                    </span>
                    {p.variantLabel && (
                      <span className="text-xs text-blue-700">
                        {p.variantLabel}
                      </span>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="px-2 text-right sm:px-4">
                <Badge variant="destructive" className="font-bold">
                  {p.inventoryCount}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
