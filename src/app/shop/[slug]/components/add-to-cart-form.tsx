"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { useCartUI } from "@/store/use-cart-ui";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddToCartProps {
  product: {
    id: string;
    title: string;
    price: number;
    slug: string;
    imageUrl: string;
    supplyType?: string;
    inventoryCount?: number;
  };
}

export function AddToCartForm({ product }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartUI((state) => state.openCart);
  const router = useRouter();

  const isPreOrder = product.supplyType === "PRE_ORDER";
  const isOutOfStock = !isPreOrder && (product.inventoryCount === undefined || product.inventoryCount <= 0);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({ ...product, quantity, supplyType: product.supplyType });
    openCart(); // Open the cart sheet automatically
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Quantity Selector */}
      <div className={`flex items-center justify-between border-2 border-gray-200 rounded-2xl p-1 h-14 w-full sm:w-36 bg-background ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
          disabled={isOutOfStock}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-bold text-lg w-8 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
          disabled={isOutOfStock}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`flex-1 h-14 rounded-sm text-base font-bold shadow-md transition-all gap-2 text-white ${
          isOutOfStock 
            ? "bg-gray-400 cursor-not-allowed" 
            : isPreOrder 
              ? "bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5" 
              : "bg-[#FF5722] hover:bg-[#E64A19] hover:-translate-y-0.5"
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {isOutOfStock ? "Hết Hàng" : isPreOrder ? "Đặt Hàng Trước" : "Thêm vào giỏ"}
      </Button>

      <Button
        variant="secondary"
        disabled={isOutOfStock}
        onClick={() => {
          if (isOutOfStock) return;
          addItem({ ...product, quantity, supplyType: product.supplyType });
          router.push("/checkout");
        }}
        className={`flex-1 h-14 rounded-sm text-base font-bold shadow-sm transition-all gap-2 text-white ${
          isOutOfStock 
            ? "bg-gray-300 cursor-not-allowed text-gray-500" 
            : "bg-neutral-900 hover:bg-neutral-800 hover:-translate-y-0.5"
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        Mua ngay
      </Button>
    </div>
  );
}
