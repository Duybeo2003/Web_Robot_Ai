"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Eye,
  MapPin,
  Phone,
  CreditCard,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { OrderStatusUpdater } from "../order-status-updater";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { confirmOrderRefund } from "@/actions/order";
import { toast } from "sonner";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export type AdminOrderDetails = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: string | null;
  receiverPhone: string | null;
  paymentMethod: string;
  customerName: string | null;
  createdAt: string | Date;
  totalAmount: number | string;
  depositAmount: number | string;
  amountPaid: number | string;
  amountDue: number | string;
  termsVersion: string | null;
  termsAcceptedAt: string | Date | null;
  user: { name: string | null; phoneNumber: string | null };
  paymentTransactions: {
    id: string;
    provider: string;
    status: string;
    amount: number | string;
    createdAt: string | Date;
    processedAt: string | Date | null;
  }[];
  items: {
    id: string;
    product: { title: string; supplyType?: string };
    variant: { attributes: unknown } | null;
    quantity: number;
    priceAtPurchase: string | number;
  }[];
};

function variantLabel(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return "";
  return Object.values(attributes)
    .filter((value): value is string | number =>
      typeof value === "string" || typeof value === "number",
    )
    .join(" - ");
}

export function OrderDetailsModal({
  order,
  canManageRefunds,
}: {
  order: AdminOrderDetails;
  canManageRefunds: boolean;
}) {
  const [isPushing, setIsPushing] = useState(false);
  const [refundReference, setRefundReference] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
        title="Xem chi tiết"
      >
        <span className="sr-only">Xem chi tiết</span>
        <Eye className="h-4 w-4 text-blue-500" />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Chi tiết Đơn hàng</SheetTitle>
          <SheetDescription>
            Mã ĐH:{" "}
            <span className="font-mono text-foreground font-medium">
              {order.id.toUpperCase()}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status Updater */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4 border">
            <h4 className="text-sm font-semibold">Cập nhật trạng thái</h4>
            <OrderStatusUpdater
              orderId={order.id}
              currentStatus={order.status}
              paymentStatus={order.paymentStatus}
              canCancelPaidOrders={canManageRefunds}
              pendingPaymentProvider={
                order.paymentTransactions.find((payment) => payment.status === "PENDING")?.provider
              }
            />
            {order.status === "PROCESSING" && (
                <div className="pt-2 border-t mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700"
                      disabled={isPushing}
                      onClick={async () => {
                        setIsPushing(true);
                        try {
                          const { pushOrderToLogistics } =
                            await import("@/actions/admin");
                          const res = await pushOrderToLogistics(order.id, "GHN");
                          if (res.success) {
                            toast.success(
                              `Đã đẩy đơn sang GHN! Mã vận đơn: ${res.trackingCode}`,
                            );
                          } else {
                            toast.error(res.error);
                          }
                        } catch {
                          toast.error("Lỗi kết nối khi gọi vận chuyển");
                        } finally {
                          setIsPushing(false);
                        }
                      }}
                    >
                      <Truck className="w-4 h-4 mr-2" /> {isPushing ? "Đang đẩy..." : "Đẩy sang GHN"}
                    </Button>
                </div>
              )}
          </div>

          {canManageRefunds &&
            ["RETURNED", "CANCELLED"].includes(order.status) &&
            ["PAID", "PARTIALLY_PAID"].includes(order.paymentStatus) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-semibold text-red-900">Xác nhận đã hoàn tiền</h4>
              <p className="mt-1 text-xs text-red-800">
                Chỉ dùng sau khi đã hoàn tiền trên cổng thanh toán hoặc ngân hàng.
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={refundReference}
                  onChange={(event) => setRefundReference(event.target.value)}
                  placeholder="Mã đối soát hoàn tiền"
                  minLength={6}
                  maxLength={191}
                />
                <Button
                  variant="destructive"
                  disabled={isRefunding || refundReference.trim().length < 6}
                  onClick={async () => {
                    setIsRefunding(true);
                    const result = await confirmOrderRefund(order.id, refundReference);
                    setIsRefunding(false);
                    if (result.success) {
                      toast.success("Đã ghi nhận hoàn tiền.");
                    } else {
                      toast.error(result.error);
                    }
                  }}
                >
                  {isRefunding ? "Đang lưu..." : "Xác nhận"}
                </Button>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <Phone className="h-4 w-4 text-primary" />
              </span>
              Thông tin liên hệ
            </h4>
            <div className="pl-9 space-y-1 text-muted-foreground">
              <p>
                <strong className="text-foreground">Tên:</strong>{" "}
                {order.customerName || order.user.name || "Khách"}
              </p>
              <p>
                <strong className="text-foreground">SĐT:</strong>{" "}
                {order.receiverPhone || order.user.phoneNumber}
              </p>
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <MapPin className="h-4 w-4 text-primary" />
              </span>
              Địa chỉ giao hàng
            </h4>
            <p className="pl-9 text-muted-foreground">
              {order.shippingAddress || "Chưa cung cấp"}
            </p>
          </div>

          {/* Payment */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <CreditCard className="h-4 w-4 text-primary" />
              </span>
              Thanh toán
            </h4>
            <div className="pl-9 space-y-1 text-muted-foreground">
              <p>
                <strong className="text-foreground">Phương thức:</strong>{" "}
                {order.paymentMethod}
              </p>
              <p>
                <strong className="text-foreground">Ngày đặt:</strong>{" "}
                {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
              {order.termsAcceptedAt && (
                <p>
                  <strong className="text-foreground">Điều khoản:</strong>{" "}
                  phiên bản {order.termsVersion || "không xác định"} · chấp nhận lúc{" "}
                  {format(new Date(order.termsAcceptedAt), "dd/MM/yyyy HH:mm")}
                </p>
              )}
              <p>
                <strong className="text-foreground">Tiền cọc ban đầu:</strong>{" "}
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.depositAmount))}
              </p>
              <p>
                <strong className="text-foreground">Đã thu:</strong>{" "}
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.amountPaid))}
              </p>
              <p>
                <strong className="text-foreground">Còn phải thu:</strong>{" "}
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.amountDue))}
              </p>
              {order.paymentTransactions.length > 0 && (
                <details className="pt-2">
                  <summary className="cursor-pointer font-medium text-blue-700">Lịch sử giao dịch</summary>
                  <ul className="mt-2 space-y-2">
                    {order.paymentTransactions.map((payment) => (
                      <li key={payment.id} className="rounded border bg-white p-2 text-xs">
                        <span className="font-semibold">{payment.provider} · {payment.status}</span>
                        <span className="block">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(payment.amount))}
                          {" · "}{format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </span>
              Sản phẩm ({order.items.length})
            </h4>
            <div className="space-y-3 pl-9">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-medium leading-snug">
                      {item.product.title}
                    </p>
                    {variantLabel(item.variant?.attributes) && (
                      <p className="text-xs text-muted-foreground mt-1 font-medium text-blue-600">
                        {variantLabel(item.variant?.attributes)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      SL: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-primary shrink-0">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(item.priceAtPurchase) * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-primary/20">
                <p className="font-bold text-base">Tổng tiền:</p>
                <p className="font-bold text-xl text-primary">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(order.totalAmount))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
