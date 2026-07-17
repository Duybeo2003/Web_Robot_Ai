import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ProductCarousel } from "@/components/ui/product-carousel";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { FlashSaleCarousel } from "@/components/ui/flash-sale-carousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const robotProducts = await prisma.product.findMany({
    where: { type: 'ROBOT_STEM' },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
  
  const kitProducts = await prisma.product.findMany({
    where: { type: 'KIT_ARDUINO' },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
  
  const logicProducts = await prisma.product.findMany({
    where: { type: 'DO_CHOI_LOGIC' },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  // Combine some products for the Flash Sale
  const flashSaleProducts = [...robotProducts.slice(0, 2), ...kitProducts.slice(0, 2), ...logicProducts.slice(0, 2)];

  return (
    <div className="flex flex-col flex-1 bg-[#F5F5F5] pb-20 overflow-hidden">
      {/* Hero Banner Area - Carousel */}
      <HeroCarousel />

      {/* FLASH SALE Section */}
      <FlashSaleCarousel products={flashSaleProducts} />

      {/* Categories using the new ProductCarousel */}
      <ProductCarousel 
        title="ROBOT AI GIÁO DỤC" 
        categoryLink="/shop?type=ROBOT_STEM"
        subLinkText="Robot mBot"
        products={robotProducts}
        badgeColor="bg-[#FF3300]"
      />

      <ProductCarousel 
        title="KIT TỰ HỌC ARDUINO" 
        categoryLink="/shop?type=KIT_ARDUINO"
        subLinkText="Arduino Uno"
        products={kitProducts}
        badgeColor="bg-[#FF5722]"
      />

      <ProductCarousel 
        title="ĐỒ CHƠI TƯ DUY LOGIC" 
        categoryLink="/shop?type=DO_CHOI_LOGIC"
        subLinkText="Rubik & Xếp Hình"
        products={logicProducts}
        badgeColor="bg-[#F44336]"
      />

    </div>
  );
}
