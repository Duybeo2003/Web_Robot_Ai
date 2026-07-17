import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Ensure fresh data on home page

import { ProductCard } from "@/components/ui/product-card";

export default async function Home() {
  const products = await prisma.product.findMany({
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  const robotProducts = products.filter(p => p.type === 'ROBOT_STEM');
  const kitProducts = products.filter(p => p.type === 'KIT_ARDUINO');
  const logicProducts = products.filter(p => p.type === 'DO_CHOI_LOGIC');

  return (
    <div className="flex flex-col flex-1 bg-[#F5F5F5] pb-20">
      {/* Hero Banner Area */}
      <section className="w-full bg-white pt-4 pb-8">
        <div className="container mx-auto px-4">
          <div className="relative w-full h-[200px] sm:h-[300px] md:h-[450px] rounded-lg overflow-hidden cursor-pointer shadow-sm">
            <Image 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop" // Tech/robotics lab image
              alt="Mừng Khai Trương Robot Thông Minh"
              fill
              priority
              className="object-cover"
            />
            {/* Banner Text Overlay */}
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
        </div>
      </section>

      {/* Category: Robot Giáo Dục */}
      {robotProducts.length > 0 && (
        <section className="w-full py-8 bg-white mt-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-sm md:text-lg font-bold text-white bg-[#FF3300] px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide">
                  ROBOT GIÁO DỤC STEM
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/shop/robot-giao-duc" className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
                  Robot mBot
                </Link>
                <Link href="/shop/robot-giao-duc" className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
                  Xem tất cả
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {robotProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category: Kit Arduino */}
      {kitProducts.length > 0 && (
        <section className="w-full py-8 bg-white mt-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-sm md:text-lg font-bold text-white bg-[#FF3300] px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide">
                  KIT TỰ HỌC ARDUINO
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/shop/kit-arduino" className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
                  Arduino Uno
                </Link>
                <Link href="/shop/kit-arduino" className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
                  Xem tất cả
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {kitProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category: Đồ Chơi Logic */}
      {logicProducts.length > 0 && (
        <section className="w-full py-8 bg-white mt-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-sm md:text-lg font-bold text-white bg-[#FF3300] px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide">
                  ĐỒ CHƠI TƯ DUY LOGIC
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/shop/do-choi-logic" className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
                  Lắp Ráp 3D
                </Link>
                <Link href="/shop/do-choi-logic" className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
                  Xem tất cả
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {logicProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
