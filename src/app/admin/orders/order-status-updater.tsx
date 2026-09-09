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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  paymentStatus,
  pendingPaymentProvider,
  canCancelPaidOrders,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  pendingPaymentProvider?: string;
  canCancelPaidOrders: boolean;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [payStatus, setPayStatus] = useState(paymentStatus);
  const [loading, setLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const statusOptions = ({
    PENDING: ["PENDING", "PROCESSING", "CANCELLED"],
    PROCESSING: ["PROCESSING", "SHIPPED", "CANCELLED"],
    SHIPPED: ["SHIPPED", "COMPLETED"],
    COMPLETED: ["COMPLETED"],
    CANCELLED: ["CANCELLED"],
    RETURNED: ["RETURNED"],
  }[status] || [status]).filter(
    (option) =>
      option !== "CANCELLED" ||
      payStatus === "UNPAID" ||
      canCancelPaidOrders,
  );
  const statusLabels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang chuẩn bị",
    SHIPPED: "Đang giao",
    COMPLETED: "Đã giao thành công",
    CANCELLED: "Đã hủy",
    RETURNED: "Đã trả hàng qua RMA",
  };

  const update = async (
    nextStatus: OrderStatus,
    nextPaymentStatus: PaymentStatus,
    reference?: string,
  ) => {
    setLoading(true);
    try {
      const result = await updateOrderStatus(
        orderId,
        nextStatus,
        nextPaymentStatus,
        reference,
      );
      if (!result.success || !("status" in result)) {
        toast.error(result.error || "Không thể cập nhật đơn hàng.");
        return false;
      }
      setStatus(result.status!);
      setPayStatus(result.paymentStatus!);
      if (reference !== undefined) setPaymentReference("");
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
          onValueChange={(value) => value && void update(value as OrderStatus, payStatus)}
          disabled={loading}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>{statusLabels[option] || option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tình trạng thanh toán
        </label>
        <div className="rounded-md border bg-white px-3 py-2 text-sm font-medium">
          {{
            UNPAID: "Chưa thanh toán",
            PARTIALLY_PAID: "Đã thanh toán một phần",
            PAID: "Đã thanh toán đủ",
            REFUNDED: "Đã hoàn tiền",
          }[payStatus] || payStatus}
        </div>
        {payStatus !== "PAID" && payStatus !== "REFUNDED" && pendingPaymentProvider && (
          <div className="space-y-2 pt-2">
            <Input
              aria-label="Mã đối soát thanh toán"
              placeholder={
                pendingPaymentProvider === "COD"
                  ? "Mã phiếu thu (tùy chọn)"
                  : "Mã giao dịch đối soát"
              }
              value={paymentReference}
              minLength={pendingPaymentProvider === "COD" ? undefined : 6}
              maxLength={191}
              onChange={(event) => setPaymentReference(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={
                loading ||
                (pendingPaymentProvider !== "COD" && paymentReference.trim().length < 6)
              }
              onClick={() => void update(status, "PAID", paymentReference)}
            >
              Xác nhận khoản {pendingPaymentProvider} đang chờ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
