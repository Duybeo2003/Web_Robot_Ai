"use client";

import { useState } from "react";
import { UserInventory, Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sellItemForXu } from "@/actions/user-inventory";
import { PackageOpen, Coins, Truck, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

  const handleRequestDelivery = () => {
    // In a real app, this would redirect to checkout or open an address modal.
    // For now we'll just show a toast for simplicity.
    toast.info("Tính năng Yêu cầu Giao hàng đang được phát triển!");
    setIsDelivering(false);
    setSelectedItem(null);
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
            <li>Bạn có thể yêu cầu <strong>Giao hàng</strong> các vật phẩm đã trúng thưởng.</li>
            <li>Hoặc bạn có thể <strong>Bán lại ra Xu</strong> (nhận lại 50% giá trị gốc của vật phẩm) để lấy vốn tiếp tục tham gia sự kiện.</li>
          </ul>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-neutral-100 text-center shadow-sm">
          <PackageOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-700 mb-2">Túi đồ trống</h2>
          <p className="text-neutral-500 mb-6">Bạn chưa có phần thưởng nào. Hãy tham gia sự kiện ngay!</p>
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
                  {item.product.images && Array.isArray(item.product.images) && (item.product.images as string[])[0] ? (
                    <Image 
                      src={(item.product.images as string[])[0]} 
                      alt={item.product.name}
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
                  <h3 className="font-bold text-neutral-800 line-clamp-2 mb-2 flex-1">{item.product.name}</h3>
                  <div className="text-sm text-neutral-500 mb-4 line-clamp-1">{item.product.description}</div>
                  
                  <Button 
                    className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold"
                    onClick={() => setSelectedItem(item)}
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
            <DialogTitle>Xử lý phần thưởng</DialogTitle>
            <DialogDescription>
              Bạn muốn làm gì với vật phẩm <strong>{selectedItem?.product.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-1 border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              onClick={handleRequestDelivery}
              disabled={isDelivering || isSelling}
            >
              <Truck className="w-6 h-6" />
              <span className="font-bold">Yêu cầu Giao hàng</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-1 border-neutral-200 hover:bg-neutral-50"
              onClick={handleSell}
              disabled={isDelivering || isSelling}
            >
              {isSelling ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900"></div>
              ) : (
                <>
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <span className="font-bold">Bán lại lấy Xu</span>
                  <span className="text-xs text-neutral-500">
                    Nhận ngay +{selectedItem ? Math.floor(Number(selectedItem.product.price) * 0.5).toLocaleString('vi-VN') : 0} Xu
                  </span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
