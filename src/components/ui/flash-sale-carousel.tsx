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

interface FlashSaleCarouselProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
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
    <section id="flash-sale-section" className="w-full mt-4 scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="bg-[#FF3300] rounded-t-lg p-4 md:p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold italic tracking-wider flex items-center">
              <span className="text-yellow-300 mr-2">⚡</span> FLASH SALE
            </h2>
            <div className="hidden md:flex items-center text-sm ml-4 border-l border-white/30 pl-4 gap-2">
              <span>
                Gọi <strong className="underline">0385.333.111</strong> hoặc{" "}
                <strong className="underline">nhắn tin Zalo</strong> để nhận tư
                vấn khuyến mại
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#FF3300] pb-6 px-4 md:px-8 rounded-b-lg relative shadow-lg">
          <Carousel
            plugins={[autoplayPlugin]}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product) => (
                <CarouselItem
                  key={`flash-${product.id}`}
                  className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 flex"
                >
                  <div className="p-1 w-full flex">
                    <ProductCard
                      product={product}
                      isWished={userWishlistIds.includes(product.id)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="block">
              <CarouselPrevious className="left-1 md:-left-4 bg-white hover:bg-neutral-100 text-black border-none z-10 w-8 h-8 md:w-10 md:h-10 shadow-md transition-all" />
              <CarouselNext className="right-1 md:-right-4 bg-white hover:bg-neutral-100 text-black border-none z-10 w-8 h-8 md:w-10 md:h-10 shadow-md transition-all" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
