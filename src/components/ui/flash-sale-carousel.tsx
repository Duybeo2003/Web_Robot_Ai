"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/ui/product-card";
import Autoplay from "embla-carousel-autoplay";
import type { Product } from "@/types/product";

interface FlashSaleCarouselProps {
  products: Product[];
  userWishlistIds?: string[];
}

export function FlashSaleCarousel({
  products,
  userWishlistIds = [],
}: FlashSaleCarouselProps) {
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 3000, stopOnInteraction: true }),
    []
  );

  if (!products || products.length === 0) return null;

  return (
    <section id="flash-sale-section" className="mt-3 w-full scroll-mt-24 py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 rounded-t-2xl bg-gradient-to-r from-[#e63212] to-[#ff5722] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center text-2xl font-black tracking-tight sm:text-3xl">
              <span className="text-yellow-300 mr-2">⚡</span> FLASH SALE
            </h2>
            <div className="hidden md:flex items-center text-sm ml-4 border-l border-white/30 pl-4 gap-2">
              <span>
                Xem ưu đãi trên từng sản phẩm hoặc liên hệ RoboEQ để được tư vấn
                khuyến mại
              </span>
            </div>
          </div>
        </div>

        <div className="relative rounded-b-2xl bg-gradient-to-r from-[#e63212] to-[#ff5722] px-3 pb-5 shadow-lg sm:px-8 sm:pb-7">
          <Carousel
            plugins={products.length > 4 ? [autoplayPlugin] : []}
            opts={{
              align: "start",
              loop: products.length > 4,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product, index) => (
                <CarouselItem
                  key={`flash-${product.id}`}
                  className="flex basis-1/2 pl-3 sm:basis-1/3 sm:pl-4 lg:basis-1/4"
                >
                  <div className="flex w-full py-1">
                    <ProductCard
                      product={product}
                      isWished={userWishlistIds.includes(product.id)}
                      eager={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden sm:block">
              <CarouselPrevious className="left-0 z-10 size-10 border-0 bg-white text-neutral-800 shadow-md hover:bg-neutral-50 sm:-left-5" />
              <CarouselNext className="right-0 z-10 size-10 border-0 bg-white text-neutral-800 shadow-md hover:bg-neutral-50 sm:-right-5" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
