"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
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
import { OrderDetailsModal } from "./order-details-modal";
import { Card } from "@/components/ui/card";
import { Download, Truck, CheckCircle, Trash } from "lucide-react";
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
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function OrdersTableClient({
  orders,
  totalPages,
  totalCount,
  currentPage,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
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

  const exportToExcel = () => {
    if (orders.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    // Prepare data for Excel
    const data = orders.map((order) => ({
      "Mã đơn hàng": order.id,
      "Tên khách hàng": order.user.name || "Khách",
      "Số điện thoại": order.receiverPhone || order.user.phoneNumber,
      "Địa chỉ": order.shippingAddress,
      "Tổng tiền": order.totalAmount,
      "Trạng thái thanh toán": order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán",
      "Trạng thái đơn hàng": order.status,
      "Phương thức": order.paymentMethod,
      "Ngày đặt": format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss"),
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Orders");
    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `DanhSachDonHang_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
  };

  const handleBulkAction = async (status: "PROCESSING" | "SHIPPED" | "COMPLETED") => {
    if (selectedIds.length === 0) return toast.error("Vui lòng chọn ít nhất 1 đơn hàng");
    
    setIsActionLoading(true);
    let successCount = 0;
    
    for (const id of selectedIds) {
      const order = orders.find(o => o.id === id);
      if (order) {
        const res = await updateOrderStatus(id, status, order.paymentStatus);
        if (res.success) successCount++;
      }
    }
    
    setIsActionLoading(false);
    setSelectedIds([]);
    
    if (successCount > 0) {
      toast.success(`Đã cập nhật trạng thái ${successCount} đơn hàng thành công`);
    } else {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
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
            Chuyển "Đang chuẩn bị"
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={selectedIds.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("SHIPPED")}
          >
            <Truck className="h-4 w-4 mr-2 text-purple-600" />
            Chuyển "Đang giao"
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
        <Button variant="outline" onClick={exportToExcel}>
          <Download className="mr-2 h-4 w-4" /> Xuất Excel
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
                      <span className="font-medium">{order.user.name || "Khách"}</span>
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
                    {order.paymentStatus === "PAID" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-transparent shadow-none">Đã thanh toán</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-transparent">Chưa thanh toán</Badge>
                    )}
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
                <Link href={`?page=${currentPage - 1}`}>
                  <Button variant="outline" size="sm">← Trước</Button>
                </Link>
              )}
              {currentPage < totalPages && (
                <Link href={`?page=${currentPage + 1}`}>
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
