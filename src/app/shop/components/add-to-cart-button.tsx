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
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-secondary hover:shadow-md sm:text-sm"
      >
        {isAffiliate ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <ListFilter className="w-4 h-4" />
        )}
        <span>{isAffiliate ? "Xem nơi bán" : "Chọn phân loại"}</span>
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
      size="sm"
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      aria-label={isOutOfStock ? "Sản phẩm đã hết hàng" : "Thêm vào giỏ hàng"}
      className="h-10 w-full rounded-lg bg-primary text-xs text-white shadow-sm transition-all hover:bg-secondary hover:shadow-md sm:text-sm"
    >
      <ShoppingCart className="w-4 h-4" />
      <span>{isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}</span>
    </Button>
  );
}
