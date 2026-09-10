"use client";

import * as React from "react";
import { getImageProps } from "next/image";
import { Pause, Play } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { GiftRecommender } from "./gift-recommender";

type ResponsiveHeroImageProps = {
  desktopSrc: string;
  desktopWidth: number;
  desktopHeight: number;
  mobileSrc: string;
  mobileWidth: number;
  mobileHeight: number;
  alt: string;
  highPriority?: boolean;
};

function ResponsiveHeroImage({
  desktopSrc,
  desktopWidth,
  desktopHeight,
  mobileSrc,
  mobileWidth,
  mobileHeight,
  alt,
  highPriority = false,
}: ResponsiveHeroImageProps) {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    src: desktopSrc,
    alt,
    width: desktopWidth,
    height: desktopHeight,
    quality: 90,
    sizes: "(min-width: 1024px) 70vw, 100vw",
    loading: highPriority ? "eager" : "lazy",
  });
  const {
    props: { srcSet: mobileSrcSet, ...mobileImageProps },
  } = getImageProps({
    src: mobileSrc,
    alt,
    width: mobileWidth,
    height: mobileHeight,
    quality: 90,
    sizes: "(max-width: 767px) calc(100vw - 32px), 1px",
    loading: highPriority ? "eager" : "lazy",
  });

  return (
    <picture className="absolute inset-0 block size-full">
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
      <img
        {...mobileImageProps}
        alt={alt}
        loading={highPriority ? "eager" : "lazy"}
        fetchPriority={highPriority ? "high" : "auto"}
        className="size-full object-cover"
      />
    </picture>
  );
}

export function HeroCarousel() {
  const plugin = React.useMemo(
    () => Autoplay({ delay: 6000, stopOnInteraction: false }),
    [],
  );
  const [paused, setPaused] = React.useState(false);

  const toggleAutoplay = () => {
    if (paused) plugin.play();
    else plugin.stop();
    setPaused((current) => !current);
  };

  return (
    <section className="w-full bg-white py-4 sm:py-5" aria-label="Nổi bật tại RoboEQ">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-stretch gap-4 lg:flex-row">
          <div className="w-full lg:flex-[7]">
            <Carousel
              plugins={[plugin]}
              onMouseEnter={() => {
                if (!paused) plugin.stop();
              }}
              onMouseLeave={() => {
                if (!paused) plugin.play();
              }}
              opts={{ align: "start", loop: true }}
              className="relative h-full w-full overflow-hidden rounded-xl"
              aria-label="Chương trình nổi bật"
            >
              <CarouselContent>
                <CarouselItem aria-label="Ưu đãi 1 trong 2">
                  <div className="relative h-[250px] w-full overflow-hidden rounded-xl shadow-sm sm:h-[300px] md:h-auto md:aspect-[27/10]">
                    <ResponsiveHeroImage
                      desktopSrc="/images/banners/banner1-desktop.png"
                      desktopWidth={1000}
                      desktopHeight={370}
                      mobileSrc="/images/banners/banner1-mobile.png"
                      mobileWidth={1024}
                      mobileHeight={1024}
                      alt="Robot AI thông minh dành cho trẻ em"
                      highPriority
                    />
                  </div>
                </CarouselItem>
                <CarouselItem aria-label="Ưu đãi 2 trong 2">
                  <div className="relative h-[250px] w-full overflow-hidden rounded-xl shadow-sm sm:h-[300px] md:h-auto md:aspect-[27/10]">
                    <ResponsiveHeroImage
                      desktopSrc="/images/banners/banner2-desktop.png"
                      desktopWidth={1000}
                      desktopHeight={370}
                      mobileSrc="/images/banners/banner2-mobile.jpg"
                      mobileWidth={819}
                      mobileHeight={1024}
                      alt="Đồ chơi giáo dục phát triển tư duy RoboEQ"
                    />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 hidden -translate-y-1/2 opacity-80 hover:opacity-100 md:flex" />
              <CarouselNext className="absolute right-4 top-1/2 hidden -translate-y-1/2 opacity-80 hover:opacity-100 md:flex" />
              <button
                type="button"
                onClick={toggleAutoplay}
                className="absolute bottom-3 right-3 z-20 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/60 bg-neutral-950/70 px-3 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={paused ? "Tiếp tục tự động chuyển banner" : "Tạm dừng tự động chuyển banner"}
                aria-pressed={paused}
              >
                {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
                <span className="hidden sm:inline">{paused ? "Tiếp tục" : "Tạm dừng"}</span>
              </button>
            </Carousel>
          </div>

          <div className="w-full lg:flex-[3]">
            <GiftRecommender />
          </div>
        </div>
      </div>
    </section>
  );
}
