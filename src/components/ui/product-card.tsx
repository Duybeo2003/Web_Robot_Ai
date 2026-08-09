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
    <div className="group relative bg-white h-fit w-full flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 rounded-lg border border-neutral-200 hover:border-primary/50 overflow-hidden">
      
      {/* Badges */}
      <div className="absolute top-0 left-0 z-10 flex flex-row flex-wrap items-start gap-[2px]">
        {product.supplyType === "PRE_ORDER" && (
          <div className="text-white text-[9px] md:text-xs font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-sm shadow-sm bg-amber-500">
            Hàng Order (7-10 ngày)
          </div>
        )}
        {hasDiscount && (
          <>
            <div className="text-white text-[9px] md:text-xs font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-sm shadow-sm" style={{ backgroundColor: theme.primary }}>
              Giảm {discountPercent}%
            </div>
          </>
        )}
      </div>

      <div className="absolute top-2 right-2 z-10">
        <WishlistButton productId={product.id} initiallyWished={isWished} />
      </div>

      {/* Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-square w-full block bg-white p-1 md:p-3">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 p-2 md:p-4 text-transparent"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
            <span className="text-neutral-400 text-sm font-medium">No image</span>
          </div>
        )}
      </Link>
      
      <div className="px-2 py-1.5 md:px-2 md:py-2 flex flex-col border-t border-neutral-100">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-medium text-[12px] md:text-sm line-clamp-2 transition-colors text-neutral-800 min-h-[32px] md:min-h-[36px] leading-tight" style={{ color: theme.primary }}>
            {product.title}
          </h3>
        </Link>
        <div className="mt-1.5 md:mt-2 pb-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
            <p className={`text-[10px] md:text-xs text-neutral-400 line-through ${hasDiscount ? '' : 'invisible'}`}>
              {hasDiscount ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(originalPrice) : '0đ'}
            </p>
            <p className="text-sm md:text-lg font-bold text-[#E30019] leading-tight sm:leading-normal">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(currentPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Area or Free Shipping Bar */}
      {action ? (
        <div className="px-2 md:px-2 pb-1.5 md:pb-2 shrink-0">
          {action}
        </div>
      ) : (
        <Link href={`/shop/${product.slug}`} className="w-full text-white py-1 text-center text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1 md:gap-1.5 cursor-pointer hover:bg-[#E64A19] transition-colors tracking-wide shrink-0 block" style={{ backgroundColor: theme.primary }}>
          <Truck className="w-3.5 h-3.5" />
          Miễn phí giao hàng
        </Link>
      )}
    </div>
  );
}
