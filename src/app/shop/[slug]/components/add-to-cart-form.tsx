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
  const isOutOfStock = !isPreOrder && !isAffiliateSell && (currentInventory === undefined || currentInventory <= 0);
  const canAddToCart = (!hasVariants || selectedVariant) && !isOutOfStock;

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
        <h3 className="font-semibold text-sm uppercase text-neutral-500 tracking-wider">Chọn Phân loại</h3>
        <div className="flex flex-wrap gap-2">
          {product.variants!.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const label = Object.values(variant.attributes).join(" - ");
            const isVariantOutOfStock = !isPreOrder && variant.inventoryCount <= 0;
            
            return (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant?.(variant)}
                className={cn(
                  "px-4 py-2 text-sm border rounded-sm font-medium transition-colors",
                  isSelected 
                    ? "border-[#FF5722] bg-orange-50 text-[#FF5722]" 
                    : "border-neutral-200 hover:border-[#FF5722]",
                  isVariantOutOfStock && !isSelected ? "opacity-50 line-through bg-neutral-100" : ""
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
        <Button
          onClick={() => {
            if (product.externalAffiliateLink) {
              window.open(product.externalAffiliateLink, "_blank");
            }
          }}
          className="w-full h-14 rounded-sm text-base font-bold shadow-md transition-all gap-2 text-white bg-[#FF5722] hover:bg-[#E64A19] hover:-translate-y-0.5"
        >
          <ShoppingBag className="w-5 h-5" />
          Mua Trên Sàn Thương Mại (Shopee/Lazada)
        </Button>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Quantity Selector */}
            <div className={cn(
              "flex items-center justify-between border-2 border-gray-200 rounded-2xl p-1 h-14 w-full sm:w-36 bg-background",
              !canAddToCart ? "opacity-50 pointer-events-none" : ""
            )}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                disabled={!canAddToCart}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                disabled={!canAddToCart}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={cn(
                "flex-1 h-14 rounded-sm text-base font-bold shadow-md transition-all gap-2 text-white",
                !canAddToCart && hasVariants && !selectedVariant ? "bg-neutral-800" :
                isOutOfStock ? "bg-gray-400 cursor-not-allowed" :
                isPreOrder ? "bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5" :
                "bg-[#FF5722] hover:bg-[#E64A19] hover:-translate-y-0.5"
              )}
            >
              <ShoppingCart className="w-5 h-5" />
              {!canAddToCart && hasVariants && !selectedVariant ? "Chọn Phân loại" :
               isOutOfStock ? "Hết Hàng" : 
               isPreOrder ? "Thêm vào giỏ (Order)" : "Thêm vào giỏ"}
            </Button>

            <Button
              variant="secondary"
              disabled={!canAddToCart}
              onClick={handleBuyNow}
              className={cn(
                "flex-1 h-14 rounded-sm text-base font-bold shadow-sm transition-all gap-2 text-white",
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
