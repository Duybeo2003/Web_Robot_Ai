"use client";

import { useState } from "react";
import { ProductGallery } from "./product-gallery";
import { AddToCartForm } from "./add-to-cart-form";
import { PromotionalBanner } from "./promotional-banner";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { ShieldCheck, Wrench, RefreshCcw } from "lucide-react";

export function ProductDetailsClient({
  product,
  isWished,
}: {
  product: any;
  isWished: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const hasVariants = product.variants && product.variants.length > 0;
  const currentPrice = hasVariants && selectedVariant ? Number(selectedVariant.price) : product.price;
  const currentOriginalPrice = hasVariants && selectedVariant && selectedVariant.originalPrice
    ? Number(selectedVariant.originalPrice)
    : product.originalPrice;
  const currentInventory = hasVariants && selectedVariant ? Number(selectedVariant.inventoryCount) : (hasVariants ? product.variants.reduce((sum: number, v: any) => sum + v.inventoryCount, 0) : product.inventoryCount);

  const discountPercent = currentOriginalPrice && currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
      {/* Gallery */}
      <ProductGallery
        images={[
          product.imageUrl,
          ...product.variants.map((v: any) => v.imageUrl).filter(Boolean),
        ].filter(Boolean) as string[]}
        title={product.title}
        selectedImage={selectedVariant?.imageUrl || null}
      />

      {/* Product Info */}
      <div className="flex flex-col">
        <div className="text-sm font-bold text-[#FF5722] mb-3 uppercase tracking-widest bg-[#FF5722]/10 inline-block px-3 py-1 rounded-sm self-start">
          {product.category?.name || "Sản phẩm Mới"}
        </div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground leading-tight">
            {product.title}
          </h1>
          <div className="shrink-0 flex items-center justify-center p-2 rounded-full border border-neutral-200 ml-4 relative hover:border-[#FF5722] transition-colors">
            <div className="absolute inset-0"></div>
            <WishlistButton productId={product.id} initiallyWished={isWished} />
          </div>
        </div>

        {/* Average Rating Display */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => {
              const avgRating =
                product.reviews && product.reviews.length > 0
                  ? product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
                    product.reviews.length
                  : 0;
              return (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(avgRating) ? "fill-current" : "text-gray-300"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              );
            })}
          </div>
          <span className="text-sm font-medium text-foreground">
            {product.reviews && product.reviews.length > 0
              ? (
                  product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
                  product.reviews.length
                ).toFixed(1)
              : 0}
          </span>
          <span className="text-sm text-muted-foreground">
            ({product.reviews?.length || 0} đánh giá)
          </span>
        </div>

        <PromotionalBanner
          isActive={product.flashSaleActive}
          endDate={product.flashSaleEndDate}
          stock={product.flashSaleStock}
        />

        <div className="flex flex-wrap items-end gap-2 md:gap-3 mb-3">
          <div className="text-3xl font-bold text-[#E30019]">
            {formatPrice(currentPrice)}
          </div>
          {currentOriginalPrice && currentOriginalPrice > currentPrice && (
            <>
              <div className="text-base md:text-lg text-neutral-400 line-through mb-1 font-medium">
                {formatPrice(currentOriginalPrice)}
              </div>
              <div className="bg-[#E30019] text-white text-xs font-bold px-2 py-1 rounded-sm mb-1.5 uppercase shadow-sm">
                Giảm {discountPercent}%
              </div>
            </>
          )}
        </div>

        <div className="mb-6 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Tình trạng:</span>
            {product.supplyType === "PRE_ORDER" ? (
              <span className="font-medium text-amber-500">
                Hàng Order (Chờ 7-10 ngày)
              </span>
            ) : (
              <span
                className={`font-medium ${currentInventory > 0 ? "text-green-600" : "text-red-500"}`}
              >
                {currentInventory > 0
                  ? `Còn hàng (${currentInventory})`
                  : "Hết hàng"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Vận chuyển:</span>
            <span className="font-medium text-foreground">Miễn phí giao hàng toàn quốc</span>
          </div>

          {product.supplyType === "PRE_ORDER" && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 mt-2 text-xs">
              <span className="font-bold">Lưu ý:</span> Đây là sản phẩm đặt trước (Pre-order). Yêu cầu thanh toán cọc 70% giá trị. Hàng sẽ về sau 7-10 ngày.
            </div>
          )}
        </div>

        <div className="prose prose-sm text-muted-foreground mb-8 line-clamp-3">
          {product.description}
        </div>

        <div className="mt-2">
          {/* We now pass selectedVariant down to AddToCartForm so it doesn't manage it on its own */}
          <AddToCartForm
            product={product}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
          />
        </div>

        {/* Trust Indicators for Tech products */}
        <div className="mt-8 pt-8 border-t border-border/50 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center text-center space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#FF5722]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bảo hành 12 tháng</span>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 border-l border-r border-border/50 px-2">
            <RefreshCcw className="w-6 h-6 text-[#FF5722]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">1 đổi 1 trong 7 ngày</span>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <Wrench className="w-6 h-6 text-[#FF5722]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hỗ trợ kỹ thuật 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
}
