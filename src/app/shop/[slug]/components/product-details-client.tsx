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
    <section className="grid grid-cols-1 items-start gap-7 lg:grid-cols-2 lg:gap-12 xl:gap-16">
      {/* Gallery */}
      <ProductGallery
        images={[
          product.imageUrl,
          ...(Array.isArray(product.gallery) ? (product.gallery as string[]) : []),
          ...product.variants.map((v: any) => v.imageUrl).filter(Boolean),
        ].filter(Boolean) as string[]}
        title={product.title}
        selectedImage={selectedVariant?.imageUrl || null}
        videoUrl={product.videoUrl as string | null}
      />

      {/* Product Info */}
      <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-3 inline-block self-start rounded-md bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
          {product.category?.name || "Sản phẩm mới"}
        </div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl xl:text-4xl">
            {product.title}
          </h1>
          <div className="shrink-0 flex items-center justify-center p-2 rounded-full border border-neutral-200 ml-4 relative hover:border-primary transition-colors">
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

        <div className="mb-4 flex flex-wrap items-end gap-2 md:gap-3">
          <div className="text-3xl font-extrabold text-[#d92d20]">
            {formatPrice(currentPrice)}
          </div>
          {currentOriginalPrice && currentOriginalPrice > currentPrice && (
            <>
              <div className="text-base md:text-lg text-neutral-400 line-through mb-1 font-medium">
                {formatPrice(currentOriginalPrice)}
              </div>
              <div className="mb-1.5 rounded-md bg-[#d92d20] px-2 py-1 text-xs font-bold text-white shadow-sm">
                Giảm {discountPercent}%
              </div>
            </>
          )}
        </div>

        <div className="mb-6 space-y-2.5 rounded-xl bg-neutral-50 p-4 text-sm">
          <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-2">
            <span className="text-muted-foreground">Tình trạng:</span>
            {product.supplyType === "AFFILIATE_SELL" ? (
              <span className="font-medium text-blue-600">Bán qua đối tác</span>
            ) : product.supplyType === "PRE_ORDER" ? (
              <span className={`font-medium ${currentInventory > 0 ? "text-amber-600" : "text-red-500"}`}>
                {currentInventory > 0
                  ? `Đặt trước - còn ${currentInventory} suất`
                  : "Hết suất đặt trước"}
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
          <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-2">
            <span className="text-muted-foreground">Vận chuyển:</span>
            <span className="font-medium text-foreground">
              {product.supplyType === "AFFILIATE_SELL"
                ? "Theo chính sách của đối tác bán hàng"
                : "Xác nhận theo chính sách giao hàng của RoboEQ"}
            </span>
          </div>

          {product.supplyType === "PRE_ORDER" && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 mt-2 text-xs">
              <span className="font-bold">Lưu ý:</span> Đây là sản phẩm đặt trước. Yêu cầu thanh toán cọc {product.depositPercent ?? 100}% giá trị.
              {product.estimatedArrivalDate
                ? ` Ngày hàng về dự kiến: ${new Date(product.estimatedArrivalDate).toLocaleDateString("vi-VN")}.`
                : " Ngày giao sẽ được RoboEQ xác nhận trước khi xử lý thanh toán."}
            </div>
          )}
        </div>

        <div className="prose prose-sm mb-6 line-clamp-3 text-muted-foreground">
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

        {/* Service policy indicators */}
        {product.supplyType === "AFFILIATE_SELL" ? (
          <div className="mt-8 border-t border-border/50 pt-6 text-sm text-muted-foreground">
            Giá, giao hàng, đổi trả và bảo hành được xác nhận tại website của đối tác trước khi thanh toán.
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-3 gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4 sm:p-5">
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="text-[11px] font-semibold leading-4 text-muted-foreground sm:text-xs">Bảo hành theo sản phẩm</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 border-l border-r border-border/50 px-2">
              <RefreshCcw className="w-6 h-6 text-primary" />
              <span className="text-[11px] font-semibold leading-4 text-muted-foreground sm:text-xs">Đổi trả theo điều kiện</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Wrench className="w-6 h-6 text-primary" />
              <span className="text-[11px] font-semibold leading-4 text-muted-foreground sm:text-xs">Hỗ trợ kỹ thuật</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
