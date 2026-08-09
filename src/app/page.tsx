import { prisma } from "@/lib/prisma";
import { ProductCarousel } from "@/components/ui/product-carousel";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { FlashSaleCarousel } from "@/components/ui/flash-sale-carousel";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

import { unstable_cache } from "next/cache";

const getCachedProducts = unstable_cache(
  async () => {
    type ProductWithCombo = {
      id: string;
      price: Prisma.Decimal | number;
      originalPrice?: Prisma.Decimal | number | null;
      comboItems?: { product: { price: Prisma.Decimal | number } }[];
      [key: string]: unknown;
    };

    const serializeProduct = (p: ProductWithCombo) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      comboItems: p.comboItems
        ? p.comboItems.map((ci) => ({
            ...ci,
            product: {
              ...ci.product,
              price: Number(ci.product.price),
            },
          }))
        : undefined,
    });

    const [robotRaw, comboRaw, logicRaw, flashSaleRaw] = await Promise.all([
      prisma.product.findMany({
        where: { type: "ROBOT_STEM", isCombo: false },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { isCombo: true },
        include: {
          comboItems: {
            include: { product: { select: { imageUrl: true, price: true } } },
          },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { type: "DO_CHOI_LOGIC", isCombo: false },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { flashSaleActive: true },
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const robotProducts = robotRaw.map(serializeProduct);
    const comboProducts = comboRaw.map(serializeProduct);
    const logicProducts = logicRaw.map(serializeProduct);
    const flashSaleProductsData = flashSaleRaw.map(serializeProduct);

    return { robotProducts, comboProducts, logicProducts, flashSaleProductsData };
  },
  ["homepage-products"],
  { revalidate: 3600 } // Cache for 1 hour
);


export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;

  let userWishlistIds: string[] = [];
  if (userId) {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });
    userWishlistIds = wishlistItems.map((w) => w.productId);
  }

  const { robotProducts, comboProducts, logicProducts, flashSaleProductsData } = await getCachedProducts();

  // Deduplicate by id just in case
  const flashSaleProducts = Array.from(
    new Map(flashSaleProductsData.map((p) => [p.id, p])).values(),
  );

  return (
    <div className="flex flex-col flex-1 bg-[#F5F5F5] overflow-hidden">
      {/* Hero Banner Area - Carousel */}
      <HeroCarousel />

      {/* VALUE PROPOSITIONS SECTION */}
      {/* (Phần Value Propositions tạm ẩn hoặc chuyển xuống Footer/About để tối ưu chiều dài trang) */}

      {/* GIFT RECOMMENDER SECTION (Moved to HeroCarousel) */}

      {/* FLASH SALE Section */}
      <FlashSaleCarousel
        products={flashSaleProducts}
        userWishlistIds={userWishlistIds}
      />

      {/* Categories using the new ProductCarousel */}
      <ProductCarousel
        title="COMBO PHÁT TRIỂN KỸ NĂNG"
        categoryLink="/shop?type=COMBO"
        subLinkText="Khám phá Gói Combo"
        products={comboProducts}
        badgeColor="bg-[#E91E63]"
        userWishlistIds={userWishlistIds}
      />

      <ProductCarousel
        title="ROBOT AI GIÁO DỤC"
        categoryLink="/shop?type=ROBOT_STEM"
        subLinkText="Robot mBot"
        products={robotProducts}
        badgeColor="bg-[#FF3300]"
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
