"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Package, Truck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { updateDeliveryStatus } from "@/actions/admin-delivery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeliveryItem {
  id: string;
  userId: string;
  inventoryItemId: string;
  status: string;
  recipientName: string;
  phoneNumber: string;
  address: string;
  notes: string | null;
  trackingCode: string | null;
  shippingFee: number;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string | null; email: string | null };
  inventoryItem: {
    product: { title: string; imageUrl: string | null };
    quantity: number;
  };
}

export default function AdminDeliveriesClientPage({ deliveries: initialDeliveries }: { deliveries: DeliveryItem[] }) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (id: string, status: string, newTrackingCode?: string) => {
    try {
      setLoading(true);
      const updated = await updateDeliveryStatus(id, status, newTrackingCode);
      setDeliveries(deliveries.map(d => d.id === updated.id ? { ...d, status: updated.status, trackingCode: updated.trackingCode } : d));
      toast.success("Đã cập nhật trạng thái đơn!");
      setIsModalOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Chờ xử lý</span>;
      case "SHIPPED": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><Truck className="w-3 h-3"/> Đang giao</span>;
      case "DELIVERED": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Đã nhận</span>;
      case "REJECTED":
      case "CANCELLED": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> Đã hủy</span>;
      default: return <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">Quản lý Giao Hàng (Trả Thưởng)</h1>
      </div>

      <div className="bg-white rounded-sm border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Mã YC / Ngày</th>
                <th className="px-6 py-4 font-bold">Thông tin nhận hàng</th>
                <th className="px-6 py-4 font-bold">Vật phẩm (Quà)</th>
                <th className="px-6 py-4 font-bold">Trạng thái</th>
                <th className="px-6 py-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <Package className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
                    Chưa có yêu cầu giao hàng nào.
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-800 uppercase text-xs">{delivery.id.slice(-6)}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {new Date(delivery.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-800">{delivery.recipientName} - {delivery.phoneNumber}</div>
                      <div className="text-xs text-neutral-600 mt-1 max-w-[250px] line-clamp-2">{delivery.address}</div>
                      {delivery.notes && (
                        <div className="text-xs text-orange-600 mt-1 italic">Ghi chú: {delivery.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-blue-600 max-w-[200px] truncate" title={delivery.inventoryItem.product.title}>
                        {delivery.inventoryItem.product.title}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Phí Ship: <span className="font-bold text-orange-500">{delivery.shippingFee === 0 ? "Freeship" : `${delivery.shippingFee.toLocaleString()}đ`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(delivery.status)}
                      {delivery.trackingCode && (
                        <div className="text-xs text-neutral-500 mt-1 font-mono bg-neutral-100 px-2 py-0.5 rounded w-fit">
                          Mã VĐ: {delivery.trackingCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {delivery.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setTrackingCode("");
                              setIsModalOpen(true);
                            }}
                          >
                            <Truck className="w-3 h-3 mr-1" /> Giao hàng
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Từ chối đơn này? Vật phẩm sẽ được hoàn lại vào túi đồ của khách.")) {
                                handleStatusUpdate(delivery.id, "REJECTED");
                              }
                            }}
                          >
                            Từ chối
                          </Button>
                        </div>
                      )}
                      {delivery.status === "SHIPPED" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            if (confirm("Đánh dấu đã giao thành công?")) {
                              handleStatusUpdate(delivery.id, "DELIVERED");
                            }
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Hoàn thành
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xác nhận giao hàng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Mã Vận Đơn (Tùy chọn)</Label>
              <Input 
                placeholder="VD: GHTK123456789"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
              />
              <p className="text-xs text-neutral-500">Khách hàng sẽ dùng mã này để tra cứu trạng thái đơn hàng.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button 
              onClick={() => {
                if (selectedDelivery) {
                  handleStatusUpdate(selectedDelivery.id, "SHIPPED", trackingCode)
                }
              }} 
              disabled={loading || !selectedDelivery} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Xác nhận Giao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
