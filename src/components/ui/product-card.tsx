import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Truck } from "lucide-react";
import { Product } from "@/types/product";
import { WishlistButton } from "@/components/ui/wishlist-button";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function ProductCard({
  product,
  action,
  isWished = false,
  eager = false,
  wideDesktopMedia = false,
}: {
  product: Product;
  action?: React.ReactNode;
  isWished?: boolean;
  eager?: boolean;
  wideDesktopMedia?: boolean;
}) {
  const currentPrice = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  
  return (
    <article
      data-ui="product-card"
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg"
    >
      <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1 sm:flex-row sm:flex-wrap">
        {product.supplyType === "AFFILIATE_SELL" ? (
          <span className="rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm sm:text-xs">
            Mua qua đối tác
          </span>
        ) : product.supplyType === "PRE_ORDER" ? (
          <span className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm sm:text-xs">
            Hàng đặt trước
          </span>
        ) : (
          <span className="rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm sm:text-xs">
            Hàng tại RoboEQ
          </span>
        )}
        {hasDiscount && (
          <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm sm:text-xs">
            Giảm {discountPercent}%
          </span>
        )}
      </div>

      <div className="absolute right-2 top-2 z-20">
        <WishlistButton productId={product.id} initiallyWished={isWished} />
      </div>

      <Link
        href={`/shop/${product.slug}`}
        className={`relative block aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-b from-neutral-50 to-white ${wideDesktopMedia ? "lg:aspect-[4/3]" : ""}`}
        aria-label={`Xem ${product.title}`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            loading={eager ? "eager" : "lazy"}
            className="object-contain p-3 text-transparent transition-transform duration-500 group-hover:scale-[1.035] sm:p-4"
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 300px"
          />
        ) : (
          <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
            <span className="text-neutral-400 text-sm font-medium">Chưa có ảnh</span>
          </div>
        )}
      </Link>
      
      <div className="flex flex-grow flex-col border-t border-neutral-100 p-3 sm:p-4">
        <Link href={`/shop/${product.slug}`} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <h3 className="line-clamp-2 min-h-9 text-[13px] font-semibold leading-[1.125rem] text-neutral-800 transition-colors group-hover:text-primary sm:min-h-10 sm:text-sm sm:leading-5 lg:min-h-0">
            {product.title}
          </h3>
        </Link>
        <div
          data-ui="product-price-row"
          className="mt-auto flex min-h-7 items-baseline gap-1 overflow-hidden pt-2 sm:gap-2"
        >
          {hasDiscount && (
            <p className="min-w-0 shrink truncate whitespace-nowrap text-[10px] font-medium leading-4 text-neutral-400 line-through sm:text-xs">
              {currency.format(originalPrice)}
            </p>
          )}
          <p className="shrink-0 whitespace-nowrap text-[13px] font-extrabold leading-6 tabular-nums text-[#d92d20] sm:text-lg">
            {currency.format(currentPrice)}
          </p>
        </div>
      </div>

      {action ? (
        <div className="shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
          {action}
        </div>
      ) : (
        <Link href={`/shop/${product.slug}`} className="flex h-10 w-full shrink-0 items-center justify-center gap-1.5 bg-primary px-2 text-center text-xs font-semibold text-white transition-colors hover:bg-secondary">
          {product.supplyType === "AFFILIATE_SELL" ? (
            <>
              <ExternalLink className="w-3.5 h-3.5" />
              Xem nơi bán
            </>
          ) : (
            <>
              <Truck className="w-3.5 h-3.5" />
              Chi tiết giao hàng
            </>
          )}
        </Link>
      )}
    </article>
  );
}
