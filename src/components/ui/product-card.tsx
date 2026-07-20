import Link from "next/link";
import Image from "next/image";
import { Truck } from "lucide-react";
import { Product } from "@/types/product";
import { theme } from "@/components/ui/theme";
import { WishlistButton } from "@/components/ui/wishlist-button";

export function ProductCard({ product, action, isWished = false }: { product: Product, action?: React.ReactNode, isWished?: boolean }) {
  const currentPrice = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  
  return (
    <div className="group relative bg-white h-full flex flex-col hover:shadow-lg transition-all duration-300 rounded-sm border border-transparent hover:border-border overflow-hidden">
      
      {/* Badges */}
      {hasDiscount && (
        <div className="absolute top-0 left-0 z-10 flex flex-col items-start gap-[2px]">
          <div className="text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-br-lg rounded-tl-sm shadow-sm" style={{ backgroundColor: theme.primary }}>
            Giảm {discountPercent}%
          </div>
          <div className="text-[9px] md:text-[10px] font-semibold px-2 bg-white/90 backdrop-blur-sm rounded-br-md" style={{ color: theme.secondary }}>
            Có giảm thêm
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 z-10">
        <WishlistButton productId={product.id} initiallyWished={isWished} />
      </div>

      {/* Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-square w-full block bg-white p-6 md:p-8 mt-2">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 p-2 md:p-4"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
            <span className="text-neutral-400 text-sm font-medium">No image</span>
          </div>
        )}
      </Link>
      
      <div className="p-3 md:p-4 flex flex-col flex-1 border-t border-neutral-100 mt-2">
        <div className="mb-2.5">
          <span className="bg-[#3b82f6] text-white text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 inline-block rounded-sm">
            Nhắn tin | Giảm giá thêm
          </span>
        </div>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-medium text-sm md:text-base line-clamp-2 transition-colors text-neutral-800 min-h-[44px] leading-snug" style={{ color: theme.primary }}>
            {product.title}
          </h3>
        </Link>
        <div className="mt-auto pt-3 pb-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            {hasDiscount && (
              <p className="text-[11px] md:text-xs text-neutral-400 line-through">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(originalPrice)}
              </p>
            )}
            <p className="text-base md:text-lg font-bold text-[#E30019] leading-none sm:leading-normal">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(currentPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Area or Free Shipping Bar */}
      {action ? (
        <div className="px-3 md:px-4 pb-3 md:pb-4 shrink-0">
          {action}
        </div>
      ) : (
        <Link href={`/shop/${product.slug}`} className="w-full text-white py-2 text-center text-[11px] md:text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-[#E64A19] transition-colors tracking-wide shrink-0 block" style={{ backgroundColor: theme.primary }}>
          <Truck className="w-4 h-4" />
          Miễn phí giao hàng
        </Link>
      )}
    </div>
  );
}
