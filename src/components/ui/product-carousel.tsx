"use client";

import * as React from "react"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ProductCard } from "@/components/ui/product-card"

interface ProductCarouselProps {
  title: string;
  categoryLink: string;
  subLinkText: string;
  products: any[];
  badgeColor?: string; // e.g., "bg-[#FF3300]"
  userWishlistIds?: string[];
}

export function ProductCarousel({
  title,
  categoryLink,
  subLinkText,
  products,
  badgeColor = "bg-[#FF3300]",
  userWishlistIds = []
}: ProductCarouselProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-8 bg-white mt-4 relative">
      <div className="container mx-auto px-4">
        {/* Header Block exactly like the reference */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <h2 className={`text-sm md:text-lg font-bold text-white ${badgeColor} px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide`}>
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href={categoryLink} className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
              {subLinkText}
            </Link>
            <Link href={categoryLink} className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
              Xem tất cả
            </Link>
          </div>
        </div>
        
        {/* Carousel Block */}
        <div className="relative px-2 md:px-10">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product) => (
                <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1">
                    <ProductCard product={product} isWished={userWishlistIds.includes(product.id)} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}
