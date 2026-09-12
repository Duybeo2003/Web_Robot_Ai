"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { useCartUI } from "@/store/use-cart-ui";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  price: number;
  originalPrice?: number | null;
  inventoryCount: number;
  sku?: string;
  imageUrl?: string;
}

interface AddToCartProps {
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number | null;
    slug: string;
    imageUrl: string;
    supplyType?: string;
    depositPercent?: number | null;
    inventoryCount?: number;
    externalAffiliateLink?: string | null;
    estimatedArrivalDate?: string | null;
    variants?: ProductVariant[];
  };
  selectedVariant?: ProductVariant | null;
  setSelectedVariant?: (variant: ProductVariant) => void;
}

export function AddToCartForm({ product, selectedVariant, setSelectedVariant }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartUI((state) => state.openCart);
  const router = useRouter();

  const hasVariants = product.variants && product.variants.length > 0;
  const currentPrice = hasVariants && selectedVariant ? Number(selectedVariant.price) : product.price;
  const currentOriginalPrice = hasVariants && selectedVariant && selectedVariant.originalPrice 
    ? Number(selectedVariant.originalPrice) 
    : product.originalPrice;
  const currentInventory = hasVariants && selectedVariant ? Number(selectedVariant.inventoryCount) : product.inventoryCount;
  
  const discountPercent = currentOriginalPrice && currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 0;
  
  const isPreOrder = product.supplyType === "PRE_ORDER";
  const isAffiliateSell = product.supplyType === "AFFILIATE_SELL";
  const isOutOfStock = !isAffiliateSell && (currentInventory === undefined || currentInventory <= 0);
  const canAddToCart = (!hasVariants || selectedVariant) && !isOutOfStock;
  const maxQuantity = Math.max(1, Math.min(99, currentInventory ?? 0));

  // Render variant options dynamically based on JSON attributes
  const renderVariantSelectors = () => {
    if (!hasVariants) return null;

    // Group variants by their attribute keys
    // Assuming all variants have the same keys, like {"Color": "Red", "Size": "L"}
    // For simplicity, we just render them as buttons
    // A robust implementation would handle combinations (e.g. gray out unavailable combinations)
    // Here we just let them pick a specific variant directly
    return (
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-neutral-700">Chọn phân loại</h3>
        <div className="flex flex-wrap gap-2">
          {product.variants!.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const label = Object.values(variant.attributes).join(" - ");
            const isVariantOutOfStock = !isPreOrder && variant.inventoryCount <= 0;
            
            return (
              <button
                type="button"
                key={variant.id}
                onClick={() => {
                  setSelectedVariant?.(variant);
                  setQuantity(1);
                }}
                disabled={isVariantOutOfStock}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-orange-50 text-primary"
                    : "border-neutral-200 hover:border-primary",
                  isVariantOutOfStock ? "opacity-50 line-through bg-neutral-100 cursor-not-allowed" : ""
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    );
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    
    addItem({
      id: product.id,
      title: product.title,
      price: currentPrice,
      slug: product.slug,
      imageUrl: (selectedVariant?.imageUrl || product.imageUrl) as string,
      supplyType: product.supplyType,
      depositPercent: product.depositPercent ?? undefined,
      inventoryCount: currentInventory,
      quantity,
      variantId: selectedVariant?.id as string | undefined,
      variantAttributes: selectedVariant?.attributes as Record<string, string> | undefined
    });
    
    openCart();
  };

  const handleBuyNow = () => {
    if (!canAddToCart) return;
    
    addItem({
      id: product.id,
      title: product.title,
      price: currentPrice,
      slug: product.slug,
      imageUrl: (selectedVariant?.imageUrl || product.imageUrl) as string,
      supplyType: product.supplyType,
      depositPercent: product.depositPercent ?? undefined,
      inventoryCount: currentInventory,
      quantity,
      variantId: selectedVariant?.id as string | undefined,
      variantAttributes: selectedVariant?.attributes as Record<string, string> | undefined
    });
    
    router.push("/checkout");
  };

  return (
    <div>

      {renderVariantSelectors()}

      {isAffiliateSell ? (
        product.externalAffiliateLink ? (
          <a
            href={product.externalAffiliateLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-secondary"
          >
              <ShoppingBag className="w-5 h-5" />
              Mua tại website đối tác
          </a>
        ) : (
          <Button disabled className="h-14 w-full rounded-xl text-base font-bold">
            Liên kết đối tác chưa khả dụng
          </Button>
        )
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Quantity Selector */}
            <div className={cn(
              "flex items-center justify-between border-2 border-gray-200 rounded-2xl p-1 h-14 w-full sm:w-36 bg-background",
              !canAddToCart ? "opacity-50 pointer-events-none" : ""
            )}>
              <button
                type="button"
                aria-label="Giảm số lượng"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                disabled={!canAddToCart}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                disabled={!canAddToCart || quantity >= maxQuantity}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={cn(
                "h-14 flex-1 rounded-xl text-base font-bold text-white shadow-md transition-all gap-2",
                !canAddToCart && hasVariants && !selectedVariant ? "bg-neutral-800" :
                isOutOfStock ? "bg-gray-400 cursor-not-allowed" :
                isPreOrder ? "bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5" :
                "bg-primary hover:bg-primary/90 hover:-translate-y-0.5"
              )}
            >
              <ShoppingCart className="w-5 h-5" />
              {!canAddToCart && hasVariants && !selectedVariant ? "Chọn phân loại" :
               isOutOfStock ? "Hết hàng" :
               isPreOrder ? "Thêm hàng đặt trước" : "Thêm vào giỏ"}
            </Button>

            <Button
              variant="secondary"
              disabled={!canAddToCart}
              onClick={handleBuyNow}
              className={cn(
                "h-14 flex-1 rounded-xl text-base font-bold text-white shadow-sm transition-all gap-2",
                !canAddToCart ? "bg-gray-300 cursor-not-allowed text-gray-500" :
                "bg-neutral-900 hover:bg-neutral-800 hover:-translate-y-0.5"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              Mua ngay
            </Button>
          </div>
          {isPreOrder && product.estimatedArrivalDate && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm font-medium text-center">
              📅 Ngày hàng về dự kiến: {new Date(product.estimatedArrivalDate).toLocaleDateString("vi-VN")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
