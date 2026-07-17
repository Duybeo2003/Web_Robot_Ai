"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cart";

export function AddToCartButton({ product }: { product: CartItem }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({ ...product, quantity: 1 });
    // Trong thực tế có thể thêm toast notification ở đây
    alert("Đã thêm vào giỏ hàng!");
  };

  return (
    <Button 
      size="lg" 
      onClick={handleAddToCart}
      className="h-14 rounded-full text-lg shadow-lg hover:shadow-primary/30 transition-all gap-2 w-full sm:w-auto"
    >
      <ShoppingCart className="w-5 h-5" />
      Thêm vào Giỏ hàng
    </Button>
  );
}
