"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { useCartUI } from "@/store/use-cart-ui";

interface OrderItemType {
  productId: string;
  variantId?: string | null;
  quantity: number;
  priceAtPurchase: number | string | { toString: () => string };
  product: {
    title: string;
    slug: string;
    imageUrl: string | null;
  };
}

export function ReorderButton({ orderItems }: { orderItems: OrderItemType[] }) {
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartUI((state) => state.openCart);

  const handleReorder = async () => {
    try {
      setLoading(true);
      for (const item of orderItems) {
        addItem({
          id: item.productId,
          title: item.product.title,
          price: Number(item.priceAtPurchase),
          slug: item.product.slug,
          imageUrl: item.product.imageUrl || "",
          quantity: item.quantity,
          variantId: item.variantId || undefined,
        });
      }
      toast.success("Đã thêm các sản phẩm vào giỏ hàng");
      openCart();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Có lỗi xảy ra khi mua lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleReorder} 
      disabled={loading}
      className="px-4 py-2 text-sm font-medium bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-sm shadow-sm flex items-center gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
      Mua lại
    </Button>
  );
}
