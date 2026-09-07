"use client";

import { useState } from "react";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { updateOrderStatus } from "@/actions/order";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  paymentStatus,
}: {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [payStatus, setPayStatus] = useState(paymentStatus);
  const [loading, setLoading] = useState(false);

  const update = async (nextStatus: string, nextPaymentStatus: string) => {
    setLoading(true);
    try {
      const result = await updateOrderStatus(
        orderId,
        nextStatus as OrderStatus,
        nextPaymentStatus as PaymentStatus,
      );
      if (!result.success || !("status" in result)) {
        toast.error(result.error || "Không thể cập nhật đơn hàng.");
        return false;
      }
      setStatus(result.status);
      setPayStatus(result.paymentStatus);
      toast.success("Đã cập nhật đơn hàng.");
      return true;
    } catch {
      toast.error("Đã xảy ra lỗi khi cập nhật đơn hàng.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tiến trình giao hàng
        </label>
        <Select
          value={status}
          onValueChange={(value) => value && void update(value, payStatus)}
          disabled={loading}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="PROCESSING">Đang chuẩn bị</SelectItem>
            <SelectItem value="SHIPPED">Đang giao</SelectItem>
            <SelectItem value="COMPLETED">Đã giao thành công</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            <SelectItem value="RETURNED">Đã trả hàng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tình trạng thanh toán
        </label>
        <Select
          value={payStatus}
          onValueChange={(value) => value && void update(status, value)}
          disabled={loading || payStatus === "PAID" || payStatus === "REFUNDED"}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
            <SelectItem value="PARTIALLY_PAID" disabled>Đã thanh toán một phần</SelectItem>
            <SelectItem value="PAID">Xác nhận khoản đang chờ</SelectItem>
            <SelectItem value="REFUNDED" disabled>Đã hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
