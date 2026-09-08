"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, ListFilter, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useCartUI } from "@/store/use-cart-ui";
import Link from "next/link";

interface AddToCartButtonProps {
  product: {
    id: string;
    title: string;
    price: number;
    slug: string;
    imageUrl: string;
    supplyType?: string;
    depositPercent?: number | null;
    inventoryCount?: number;
    hasVariants?: boolean;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartUI((state) => state.openCart);

  if (product.supplyType === "AFFILIATE_SELL" || product.hasVariants) {
    const isAffiliate = product.supplyType === "AFFILIATE_SELL";
    return (
      <Link
        href={`/shop/${product.slug}`}
        aria-label={isAffiliate ? "Xem nơi bán" : "Chọn phân loại sản phẩm"}
        className="inline-flex size-8 items-center justify-center rounded-full bg-[#FF5722] text-white shadow-md transition-all hover:-translate-y-1 hover:bg-[#E64A19] hover:shadow-xl"
      >
        {isAffiliate ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <ListFilter className="w-4 h-4" />
        )}
      </Link>
    );
  }

  const isOutOfStock = (product.inventoryCount ?? 0) <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if wrapped in link
    e.stopPropagation(); // Prevent event bubbling

    addItem({
      ...product,
      depositPercent: product.depositPercent ?? undefined,
      quantity: 1,
    });
    openCart();
  };

  return (
    <Button
      size="icon"
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      aria-label={isOutOfStock ? "Sản phẩm đã hết hàng" : "Thêm vào giỏ hàng"}
      className="rounded-full shadow-md hover:shadow-xl transition-all bg-[#FF5722] hover:bg-[#E64A19] text-white hover:-translate-y-1"
    >
      <ShoppingCart className="w-4 h-4" />
    </Button>
  );
}
