"use client";

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

export function HeroCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  return (
    <section className="w-full bg-white pt-4 pb-4">
      <div className="container mx-auto px-4">
        <Carousel
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full relative rounded-lg overflow-hidden"
        >
          <CarouselContent>
            {/* Slide 1 */}
            <CarouselItem>
              <div className="relative w-full h-[200px] sm:h-[300px] md:h-[450px] cursor-pointer shadow-sm">
                <Image 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop"
                  alt="Mừng Khai Trương Robot Thông Minh"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center px-6 md:px-12">
                  <div className="text-white space-y-2 md:space-y-4 max-w-lg">
                    <span className="px-2 py-1 bg-[#FF5722] text-[10px] md:text-xs font-bold uppercase rounded-sm inline-block">Khai trương hồng phát</span>
                    <h2 className="text-2xl md:text-5xl font-bold leading-tight">ROBOT GIÁO DỤC <br/><span className="text-[#FF5722]">SỐ 1 VIỆT NAM</span></h2>
                    <p className="hidden md:block text-base opacity-90">Giảm giá lên đến 50% cho tất cả các bộ Kit STEM và Robot Lập Trình.</p>
                    <Button size="sm" className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold px-6 md:h-12 mt-2 md:mt-4 text-xs md:text-base">
                      MUA NGAY
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
            {/* Slide 2 */}
            <CarouselItem>
              <div className="relative w-full h-[200px] sm:h-[300px] md:h-[450px] cursor-pointer shadow-sm">
                <Image 
                  src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop"
                  alt="Đồ chơi Logic Thông Minh"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/80 to-transparent flex flex-col justify-center items-end px-6 md:px-12 text-right">
                  <div className="text-white space-y-2 md:space-y-4 max-w-lg">
                    <span className="px-2 py-1 bg-[#2196F3] text-[10px] md:text-xs font-bold uppercase rounded-sm inline-block">Mới ra mắt</span>
                    <h2 className="text-2xl md:text-5xl font-bold leading-tight">PHÁT TRIỂN <br/><span className="text-[#2196F3]">TƯ DUY LOGIC</span></h2>
                    <p className="hidden md:block text-base opacity-90">Bộ sưu tập đồ chơi trí tuệ xếp hình 3D cao cấp.</p>
                    <Button size="sm" className="bg-[#2196F3] hover:bg-[#1976D2] text-white font-bold px-6 md:h-12 mt-2 md:mt-4 text-xs md:text-base">
                      KHÁM PHÁ
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 hidden md:flex" />
        </Carousel>
      </div>
    </section>
  )
}
