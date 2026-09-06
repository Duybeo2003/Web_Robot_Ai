"use client";

import { useState } from "react";
import { UserInventory, Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requestDelivery, sellItemForXu } from "@/actions/user-inventory";
import { PackageOpen, Coins, Truck, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InventoryItem extends UserInventory {
  product: Product;
}

interface InventoryClientPageProps {
  inventory: InventoryItem[];
}

export default function InventoryClientPage({ inventory: initialInventory }: InventoryClientPageProps) {
  const [items, setItems] = useState(initialInventory);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryData, setDeliveryData] = useState({ name: "", phone: "", address: "", notes: "" });

  const handleSell = async () => {
    if (!selectedItem) return;
    try {
      setIsSelling(true);
      const xu = await sellItemForXu(selectedItem.id);
      setItems(items.filter(i => i.id !== selectedItem.id));
      setSelectedItem(null);
      toast.success(`Đã bán vật phẩm và nhận lại ${xu.toLocaleString('vi-VN')} Xu!`);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Có lỗi xảy ra khi bán vật phẩm");
    } finally {
      setIsSelling(false);
    }
  };

  const handleRequestDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!deliveryData.name || !deliveryData.phone || !deliveryData.address) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    try {
      setIsDelivering(true);
      await requestDelivery(selectedItem.id, deliveryData);
      setItems(items.filter(i => i.id !== selectedItem.id));
      setSelectedItem(null);
      setShowDeliveryForm(false);
      toast.success("Yêu cầu giao hàng thành công! Vui lòng chờ admin xử lý.");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Có lỗi xảy ra");
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-foreground">Túi Đồ Sự Kiện</h1>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800">
          <p className="font-bold mb-1">Quyền lợi Túi Đồ:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bạn có thể yêu cầu <strong>Giao hàng (Miễn phí)</strong> các vật phẩm đã trúng thưởng.</li>
            <li>Hoặc bạn có thể <strong>Bán lại ra Xu</strong> để tiếp tục mua sắm hoặc chơi sự kiện. Giá bán lại do cửa hàng quy định (hoặc 100% giá gốc).</li>
          </ul>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-neutral-100 text-center shadow-sm">
          <PackageOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-700 mb-2">Túi đồ trống</h2>
          <p className="text-neutral-500 mb-6">Bạn chưa có vật phẩm nào hoặc tất cả đã được xử lý.</p>
          <Button onClick={() => window.location.href = '/events'} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
            Đến Khu Sự Kiện
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            return (
              <div key={item.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
                <div className="relative aspect-square bg-neutral-100 p-4 flex items-center justify-center overflow-hidden">
                  {item.product.imageUrl ? (
                    <Image 
                      src={item.product.imageUrl} 
                      alt={item.product.title}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <PackageOpen className="w-16 h-16 text-neutral-300" />
                  )}
                  {item.quantity > 1 && (
                    <div className="absolute top-2 right-2 bg-neutral-900 text-white text-xs font-bold px-2 py-1 rounded-sm shadow-md">
                      x{item.quantity}
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-neutral-800 line-clamp-2 mb-2 flex-1">{item.product.title}</h3>
                  <div className="text-sm text-neutral-500 mb-4 line-clamp-1">{item.product.description}</div>
                  
                  <Button 
                    className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold"
                    onClick={() => { setSelectedItem(item); setShowDeliveryForm(false); }}
                  >
                    Xử lý vật phẩm
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{showDeliveryForm ? "Yêu cầu giao hàng" : "Xử lý phần thưởng"}</DialogTitle>
            <DialogDescription>
              {showDeliveryForm ? "Điền thông tin để chúng tôi giao quà tận nơi (Freeship)." : `Bạn muốn làm gì với vật phẩm ${selectedItem?.product.title}?`}
            </DialogDescription>
          </DialogHeader>
          
          {!showDeliveryForm ? (
            <div className="grid gap-4 py-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1 border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                onClick={() => setShowDeliveryForm(true)}
                disabled={isSelling}
              >
                <Truck className="w-6 h-6" />
                <span className="font-bold">Yêu cầu Giao hàng (Freeship)</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1 border-neutral-200 hover:bg-neutral-50"
                onClick={handleSell}
                disabled={isSelling}
              >
                {isSelling ? (
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                ) : (
                  <>
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span className="font-bold">Bán lại lấy Xu</span>
                    <span className="text-xs text-neutral-500">
                      Nhận ngay +{selectedItem ? (selectedItem.sellPriceXu !== null ? selectedItem.sellPriceXu : Math.floor(Number(selectedItem.product.price))).toLocaleString('vi-VN') : 0} Xu
                    </span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestDelivery} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Họ tên người nhận</Label>
                <Input required placeholder="Ví dụ: Nguyễn Văn A" value={deliveryData.name} onChange={e => setDeliveryData({...deliveryData, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Số điện thoại</Label>
                <Input required placeholder="Ví dụ: 0987654321" value={deliveryData.phone} onChange={e => setDeliveryData({...deliveryData, phone: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Địa chỉ nhận hàng (Chi tiết)</Label>
                <Input required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" value={deliveryData.address} onChange={e => setDeliveryData({...deliveryData, address: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Ghi chú (Tùy chọn)</Label>
                <Input placeholder="Giao giờ hành chính..." value={deliveryData.notes} onChange={e => setDeliveryData({...deliveryData, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowDeliveryForm(false)}>Quay lại</Button>
                <Button type="submit" disabled={isDelivering} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {isDelivering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Xác nhận giao hàng
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
