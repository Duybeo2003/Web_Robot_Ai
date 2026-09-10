"use client";

import * as React from "react";
import Link from "next/link";
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

interface ProductCarouselProps {
  title: string;
  categoryLink: string;
  subLinkText: string;
  products: Product[];
  badgeColor?: string; // e.g., "bg-[#FF3300]"
  userWishlistIds?: string[];
}

export function ProductCarousel({
  title,
  categoryLink,
  subLinkText,
  products,
  badgeColor = "bg-[#FF3300]",
  userWishlistIds = [],
}: ProductCarouselProps) {
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 3000, stopOnInteraction: true }),
    []
  );

  if (!products || products.length === 0) return null;

  const desktopItemWidth =
    products.length === 1
      ? "lg:basis-full"
      : products.length === 2
        ? "lg:basis-1/2"
        : products.length === 3
          ? "lg:basis-1/3"
          : "lg:basis-1/4";

  return (
    <section className="relative mt-3 w-full bg-white py-8 sm:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`h-8 w-1.5 shrink-0 rounded-full ${badgeColor}`} aria-hidden="true" />
            <h2
              className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl"
            >
              {title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={categoryLink}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary sm:text-sm"
            >
              {subLinkText}
            </Link>
            <Link
              href={categoryLink}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 sm:text-sm"
            >
              Xem tất cả
            </Link>
          </div>
        </div>

        {/* Carousel Block */}
        <div className="relative sm:px-8">
          <Carousel
            plugins={products.length > 4 ? [autoplayPlugin] : []}
            opts={{
              align: "start",
              loop: products.length > 4,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {products.map((product, index) => (
                <CarouselItem
                  key={product.id}
                  className={`flex basis-1/2 pl-3 sm:basis-1/3 sm:pl-4 ${desktopItemWidth}`}
                >
                  <div className="flex w-full py-1">
                    <ProductCard
                      product={product}
                      isWished={userWishlistIds.includes(product.id)}
                      wideDesktopMedia={products.length === 3}
                      eager={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {products.length > 3 && (
              <div className={products.length <= 4 ? "hidden sm:block lg:hidden" : "hidden sm:block"}>
                <CarouselPrevious className="left-0 z-10 size-10 border border-neutral-200 bg-white text-neutral-800 shadow-md transition-all hover:bg-neutral-50" />
                <CarouselNext className="right-0 z-10 size-10 border border-neutral-200 bg-white text-neutral-800 shadow-md transition-all hover:bg-neutral-50" />
              </div>
            )}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
