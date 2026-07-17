import Link from "next/link";
import Image from "next/image";
import { Truck } from "lucide-react";

export function ProductCard({ product, action }: { product: any, action?: React.ReactNode }) {
  // Calculate a deterministic discount percent based on the product ID to avoid hydration mismatch
  const discountPercent = product?.id 
    ? (product.id.charCodeAt(0) + product.id.charCodeAt(product.id.length - 1)) % 30 + 10 
    : 15;
  
  return (
    <div className="group relative bg-white flex flex-col hover:shadow-lg transition-all duration-300 rounded-sm border border-transparent hover:border-border overflow-hidden">
      
      {/* Badges */}
      <div className="absolute top-0 left-0 z-10 flex flex-col items-start gap-[2px]">
        <div className="bg-[#E30019] text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-br-lg rounded-tl-sm shadow-sm">
          Giảm {discountPercent}%
        </div>
        <div className="text-[#0066FF] text-[9px] md:text-[10px] font-semibold px-2 bg-white/90 backdrop-blur-sm rounded-br-md">
          Có giảm thêm
        </div>
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-60">
        <div className="w-4 h-4 bg-neutral-200 text-neutral-500 rounded-full flex items-center justify-center text-[8px] font-bold">R</div>
        <span className="text-[8px] font-semibold text-neutral-400 uppercase tracking-wider">ROBOED</span>
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
          <h3 className="font-medium text-sm md:text-base line-clamp-2 hover:text-[#FF5722] transition-colors text-neutral-800 min-h-[44px] leading-snug">
            {product.title}
          </h3>
        </Link>
        <div className="mt-auto pt-3 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] md:text-xs text-neutral-400 line-through">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price) * (1 + discountPercent/100))}
            </p>
            <p className="text-base md:text-lg font-bold text-[#E30019]">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price))}
            </p>
          </div>
        </div>
      </div>

      {/* Action Area or Free Shipping Bar */}
      {action ? (
        <div className="px-3 md:px-4 pb-3 md:pb-4 mt-auto">
          {action}
        </div>
      ) : (
        <div className="w-full bg-[#FF5722] text-white py-2 text-center text-[11px] md:text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-[#E64A19] transition-colors mt-auto tracking-wide">
          <Truck className="w-4 h-4" />
          Miễn phí giao hàng
        </div>
      )}
    </div>
  );
}
