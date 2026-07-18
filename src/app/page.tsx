import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ProductCarousel } from "@/components/ui/product-carousel";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { FlashSaleCarousel } from "@/components/ui/flash-sale-carousel";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;
  
  let userWishlistIds: string[] = [];
  if (userId) {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true }
    });
    userWishlistIds = wishlistItems.map(w => w.productId);
  }

  const serializeProduct = (p: any) => ({ ...p, price: Number(p.price) });

  const robotProducts = (await prisma.product.findMany({
    where: { type: 'ROBOT_STEM' },
    take: 8,
    orderBy: { createdAt: "desc" },
  })).map(serializeProduct);
  
  const kitProducts = (await prisma.product.findMany({
    where: { type: 'KIT_ARDUINO' },
    take: 8,
    orderBy: { createdAt: "desc" },
  })).map(serializeProduct);
  
  const logicProducts = (await prisma.product.findMany({
    where: { type: 'DO_CHOI_LOGIC' },
    take: 8,
    orderBy: { createdAt: "desc" },
  })).map(serializeProduct);

  // Combine some products for the Flash Sale
  const flashSaleProducts = [...robotProducts.slice(0, 2), ...kitProducts.slice(0, 2), ...logicProducts.slice(0, 2)];

  return (
    <div className="flex flex-col flex-1 bg-[#F5F5F5] pb-20 overflow-hidden">
      {/* Hero Banner Area - Carousel */}
      <HeroCarousel />

      {/* VALUE PROPOSITIONS SECTION */}
      <section className="bg-white py-8 border-b border-neutral-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              </div>
              <h3 className="font-bold text-sm uppercase text-neutral-800">Sản phẩm chính hãng</h3>
              <p className="text-xs text-neutral-500">Cam kết chất lượng 100%</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-[#2196F3]/10 flex items-center justify-center text-[#2196F3]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 14h6"/><path d="M9 10h6"/></svg>
              </div>
              <h3 className="font-bold text-sm uppercase text-neutral-800">Đổi trả dễ dàng</h3>
              <p className="text-xs text-neutral-500">Trong vòng 7 ngày miễn phí</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-[#4CAF50]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </div>
              <h3 className="font-bold text-sm uppercase text-neutral-800">Giao hàng hỏa tốc</h3>
              <p className="text-xs text-neutral-500">Freeship toàn quốc từ 500k</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-[#9C27B0]/10 flex items-center justify-center text-[#9C27B0]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="font-bold text-sm uppercase text-neutral-800">Bảo mật thông tin</h3>
              <p className="text-xs text-neutral-500">An toàn tuyệt đối 100%</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLASH SALE Section */}
      <FlashSaleCarousel products={flashSaleProducts} userWishlistIds={userWishlistIds} />

      {/* Categories using the new ProductCarousel */}
      <ProductCarousel 
        title="ROBOT AI GIÁO DỤC" 
        categoryLink="/shop?type=ROBOT_STEM"
        subLinkText="Robot mBot"
        products={robotProducts}
        badgeColor="bg-[#FF3300]"
        userWishlistIds={userWishlistIds}
      />

      <ProductCarousel 
        title="KIT TỰ HỌC ARDUINO" 
        categoryLink="/shop?type=KIT_ARDUINO"
        subLinkText="Arduino Uno"
        products={kitProducts}
        badgeColor="bg-[#FF5722]"
        userWishlistIds={userWishlistIds}
      />

      <ProductCarousel 
        title="ĐỒ CHƠI TƯ DUY LOGIC" 
        categoryLink="/shop?type=DO_CHOI_LOGIC"
        subLinkText="Rubik & Xếp Hình"
        products={logicProducts}
        badgeColor="bg-[#F44336]"
        userWishlistIds={userWishlistIds}
      />

    </div>
  );
}
