"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderDetailsModal, type AdminOrderDetails } from "./order-details-modal";
import { Card } from "@/components/ui/card";
import { Download, Truck, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/order";

const getOrderStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-transparent">Chờ xử lý</Badge>;
    case "PROCESSING":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-transparent">Đang chuẩn bị</Badge>;
    case "SHIPPED":
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-transparent">Đang giao</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-100 text-green-800 border-transparent">Đã giao thành công</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Đã hủy</Badge>;
    case "RETURNED":
      return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Đã trả hàng</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  if (status === "PAID") {
    return <Badge className="border-transparent bg-emerald-100 text-emerald-700 shadow-none">Đã thanh toán</Badge>;
  }
  if (status === "PARTIALLY_PAID") {
    return <Badge className="border-transparent bg-amber-100 text-amber-800 shadow-none">Đã thu một phần</Badge>;
  }
  if (status === "REFUNDED") {
    return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Đã hoàn tiền</Badge>;
  }
  return <Badge variant="secondary" className="border-transparent bg-stone-100 text-stone-600">Chưa thanh toán</Badge>;
};

export function OrdersTableClient({
  orders,
  totalPages,
  totalCount,
  currentPage,
  query,
}: {
   
  orders: AdminOrderDetails[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
  query: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(orders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const exportToCsv = async () => {
    if (orders.length === 0) return toast.error("Không có dữ liệu để xuất");
    const { saveAs } = await import("file-saver");

    const data = orders.map((order) => ({
      "Mã đơn hàng": order.id,
      "Tên khách hàng": order.customerName || order.user.name || "Khách",
      "Số điện thoại": order.receiverPhone || order.user.phoneNumber,
      "Địa chỉ": order.shippingAddress,
      "Tổng tiền": order.totalAmount,
      "Trạng thái thanh toán": ({
        UNPAID: "Chưa thanh toán",
        PARTIALLY_PAID: "Đã thu một phần",
        PAID: "Đã thanh toán",
        REFUNDED: "Đã hoàn tiền",
      } as Record<string, string>)[order.paymentStatus] || order.paymentStatus,
      "Trạng thái đơn hàng": order.status,
      "Phương thức": order.paymentMethod,
      "Ngày đặt": format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss"),
    }));

    const escapeCsvCell = (value: unknown) => {
      let text = String(value ?? "");
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const headers = Object.keys(data[0]);
    const rows = [
      headers.map(escapeCsvCell).join(","),
      ...data.map((row) =>
        headers
          .map((header) => escapeCsvCell(row[header as keyof typeof row]))
          .join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${rows.join("\r\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, `DanhSachDonHang_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
  };

  const handleBulkAction = async (status: "PROCESSING" | "SHIPPED" | "COMPLETED") => {
    if (selectedIds.length === 0) return toast.error("Vui lòng chọn ít nhất 1 đơn hàng");

    setIsActionLoading(true);
    let successCount = 0;
    let requestFailed = false;
    try {
      for (const id of selectedIds) {
        const order = orders.find((candidate) => candidate.id === id);
        if (order) {
          const result = await updateOrderStatus(id, status, order.paymentStatus);
          if (result.success) successCount += 1;
        }
      }
    } catch {
      requestFailed = true;
      toast.error("Kết nối bị gián đoạn khi cập nhật đơn hàng.");
    } finally {
      setIsActionLoading(false);
      setSelectedIds([]);
    }

    if (requestFailed) return;

    if (successCount === selectedIds.length) {
      toast.success(`Đã cập nhật ${successCount} đơn hàng.`);
    } else if (successCount > 0) {
      toast.warning(`Đã cập nhật ${successCount}/${selectedIds.length} đơn; các đơn còn lại không đủ điều kiện.`);
    } else {
      toast.error("Không có đơn nào đủ điều kiện chuyển trạng thái.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Đã chọn: {selectedIds.length}</span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={selectedIds.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("PROCESSING")}
          >
            Chuyển &quot;Đang chuẩn bị&quot;
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={selectedIds.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("SHIPPED")}
          >
            <Truck className="h-4 w-4 mr-2 text-purple-600" />
            Chuyển &quot;Đang giao&quot;
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={selectedIds.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("COMPLETED")}
          >
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Hoàn thành
          </Button>
        </div>
        <Button variant="outline" onClick={exportToCsv}>
          <Download className="mr-2 h-4 w-4" /> Xuất CSV
        </Button>
      </div>

      <Card className="rounded-xl border shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={orders.length > 0 && selectedIds.length === orders.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Không có đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(order.id)}
                      onCheckedChange={(checked) => handleSelect(order.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">
                    {order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customerName || order.user.name || "Khách"}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.receiverPhone || order.user.phoneNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-semibold text-[#FF5722]">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(order.totalAmount))}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </TableCell>
                  <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <OrderDetailsModal order={order} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages} (Tổng: {totalCount})
            </p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link href={`?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(currentPage - 1) })}`}>
                  <Button variant="outline" size="sm">← Trước</Button>
                </Link>
              )}
              {currentPage < totalPages && (
                <Link href={`?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(currentPage + 1) })}`}>
                  <Button variant="outline" size="sm">Sau →</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
