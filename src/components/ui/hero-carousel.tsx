"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { theme } from "@/components/ui/theme";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { GiftRecommender } from "./gift-recommender";

export function HeroCarousel() {
  const plugin = React.useMemo(
    () => Autoplay({ delay: 4000, stopOnInteraction: true }),
    [],
  );

  return (
    <section className="w-full bg-white pt-4 pb-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 70% Width for Carousel on Desktop */}
          <div className="w-full lg:w-[70%]">
            <Carousel
              plugins={[plugin]}
              onMouseEnter={plugin.stop}
              onMouseLeave={plugin.reset}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full relative rounded-lg overflow-hidden h-full"
            >
              <CarouselContent>
                {/* Slide 1 */}
                <CarouselItem>
                  <div className="relative w-full h-[250px] sm:h-[300px] md:h-auto md:aspect-[27/10] cursor-pointer shadow-sm rounded-lg overflow-hidden">
                    {/* Desktop Image */}
                    <div className="hidden md:block w-full h-full relative">
                      <Image
                        src="/images/banners/banner1-desktop.png"
                        alt="Robot AI thông minh cho trẻ"
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>
                    {/* Mobile Image */}
                    <div className="block md:hidden w-full h-full relative">
                      <Image
                        src="/images/banners/banner1-mobile.png"
                        alt="Robot AI thông minh cho trẻ"
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>
                  </div>
                </CarouselItem>
                {/* Slide 2 */}
                <CarouselItem>
                  <div className="relative w-full h-[250px] sm:h-[300px] md:h-auto md:aspect-[27/10] cursor-pointer shadow-sm rounded-lg overflow-hidden">
                    {/* Desktop Image */}
                    <div className="hidden md:block w-full h-full relative">
                      <Image
                        src="/images/banners/banner2-desktop.png"
                        alt="Đồ chơi giáo dục RoboEQ"
                        fill
                        priority={true}
                        className="object-cover"
                      />
                    </div>
                    {/* Mobile Image */}
                    <div className="block md:hidden w-full h-full relative">
                      <Image
                        src="/images/banners/banner2-mobile.jpg"
                        alt="Bảng vẽ thông minh tự xóa"
                        fill
                        priority={true}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 hidden md:flex" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 hidden md:flex" />
            </Carousel>
          </div>

          {/* 30% Width for Gift Recommender on Desktop */}
          <div className="w-full lg:w-[30%]">
            <GiftRecommender />
          </div>
        </div>
      </div>
    </section>
  );
}
