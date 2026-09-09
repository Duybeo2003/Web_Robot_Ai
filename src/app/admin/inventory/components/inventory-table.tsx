"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type InventoryTransactionRow = {
  id: string;
  type: "IN" | "OUT";
  source: "MANUAL" | "SALE" | "CANCELLATION" | "RETURN";
  quantity: number;
  costPrice: unknown;
  reference: string | null;
  orderId: string | null;
  createdAt: string | Date;
  product: { title: string; sku: string | null };
  variant: { sku: string | null; attributes: unknown } | null;
  user: { name: string | null; email: string | null } | null;
};

const sourceLabels: Record<InventoryTransactionRow["source"], string> = {
  MANUAL: "Thủ công",
  SALE: "Bán hàng",
  CANCELLATION: "Hủy đơn",
  RETURN: "Đổi trả",
};

function variantLabel(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return "";
  }
  return Object.values(attributes)
    .filter((value): value is string | number =>
      typeof value === "string" || typeof value === "number",
    )
    .join(" - ");
}

export function InventoryTable({
  transactions,
}: {
  transactions: InventoryTransactionRow[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <p>Chưa có giao dịch xuất/nhập kho nào.</p>
      </div>
    );
  }

  const formatPrice = (price: unknown) => {
    if (!price) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead>Giao dịch kho</TableHead>
            <TableHead className="hidden md:table-cell">Biến động</TableHead>
            <TableHead className="hidden md:table-cell">Sản phẩm</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Số lượng</TableHead>
            <TableHead className="hidden text-right xl:table-cell">Giá vốn nhập</TableHead>
            <TableHead className="hidden lg:table-cell">Tham chiếu</TableHead>
            <TableHead className="hidden xl:table-cell">Người thực hiện</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="min-w-0 font-medium">
                <span>{format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}</span>
                <div className="mt-2 space-y-1 md:hidden">
                  <div className="line-clamp-2 text-sm font-semibold">{tx.product.title}</div>
                  <div className="text-xs text-muted-foreground">SKU: {tx.variant?.sku || tx.product.sku || "Chưa cập nhật"}</div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className={tx.type === "IN" ? "border-green-200 bg-green-50 text-green-700" : "border-orange-200 bg-orange-50 text-orange-700"}>
                      {tx.type === "IN" ? "Nhập kho" : "Xuất kho"}
                    </Badge>
                    <strong className={tx.type === "IN" ? "text-green-600" : "text-orange-600"}>
                      {tx.type === "IN" ? "+" : "-"}{tx.quantity}
                    </strong>
                    <span className="text-xs text-muted-foreground">{sourceLabels[tx.source]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.orderId ? `Đơn ${tx.orderId.slice(0, 10).toUpperCase()}` : tx.reference || "Không có tham chiếu"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {tx.type === "IN" ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit gap-1"
                  >
                    <ArrowDownRight className="w-3 h-3" /> Nhập kho
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 flex items-center w-fit gap-1"
                  >
                    <ArrowUpRight className="w-3 h-3" /> Xuất kho
                  </Badge>
                )}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {sourceLabels[tx.source]}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm line-clamp-1">
                    {tx.product.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    SKU: {tx.variant?.sku || tx.product.sku || "Chưa cập nhật"}
                  </span>
                  {tx.variant && (
                    <span className="text-xs text-blue-700">
                      {variantLabel(tx.variant.attributes)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-right font-bold text-base lg:table-cell">
                <span
                  className={
                    tx.type === "IN" ? "text-green-600" : "text-orange-600"
                  }
                >
                  {tx.type === "IN" ? "+" : "-"}
                  {tx.quantity}
                </span>
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground xl:table-cell">
                {tx.type === "IN" ? formatPrice(tx.costPrice) : "-"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {tx.orderId ? (
                  <Link
                    href={`/admin/orders?q=${encodeURIComponent(tx.orderId)}`}
                    className="font-mono text-xs text-blue-700 hover:underline"
                  >
                    {tx.orderId.slice(0, 10).toUpperCase()}
                  </Link>
                ) : (
                  <span className="text-sm">{tx.reference || "-"}</span>
                )}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <div className="flex flex-col">
                  <span className="text-sm">{tx.user?.name || "Hệ thống"}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
