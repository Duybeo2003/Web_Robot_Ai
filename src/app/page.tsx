import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { auth } from "@/auth";
import { FlashSaleCarousel } from "@/components/ui/flash-sale-carousel";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { PageLoading } from "@/components/ui/page-loading";
import { ProductCarousel } from "@/components/ui/product-carousel";
import { prisma } from "@/lib/prisma";

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  originalPrice: true,
  imageUrl: true,
  supplyType: true,
} satisfies Prisma.ProductSelect;

const getCachedProducts = unstable_cache(
  async () => {
    const now = new Date();
    const [robotRaw, comboRaw, logicRaw, flashSaleRaw] = await Promise.all([
      prisma.product.findMany({
        where: { type: "ROBOT_STEM", isCombo: false, deletedAt: null },
        select: cardSelect,
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { isCombo: true, deletedAt: null },
        select: cardSelect,
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { type: "DO_CHOI_LOGIC", isCombo: false, deletedAt: null },
        select: cardSelect,
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: {
          flashSaleActive: true,
          flashSaleEndDate: { gt: now },
          flashSaleStock: { gt: 0 },
          deletedAt: null,
        },
        select: cardSelect,
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const serialize = (products: typeof robotRaw) =>
      products.map((product) => ({
        ...product,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      }));

    return {
      robotProducts: serialize(robotRaw),
      comboProducts: serialize(comboRaw),
      logicProducts: serialize(logicRaw),
      flashSaleProducts: serialize(flashSaleRaw),
    };
  },
  ["homepage-products-v4"],
  { revalidate: 60, tags: ["products"] },
);

async function HomeContent() {
  const session = await auth();
  const userId = session?.user?.id;
  const [catalog, wishlistItems] = await Promise.all([
    getCachedProducts(),
    userId
      ? prisma.wishlist.findMany({ where: { userId }, select: { productId: true } })
      : Promise.resolve([]),
  ]);
  const userWishlistIds = wishlistItems.map((item) => item.productId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#F5F5F5]">
      <HeroCarousel />
      <FlashSaleCarousel
        products={catalog.flashSaleProducts}
        userWishlistIds={userWishlistIds}
      />
      <ProductCarousel
        title="Combo phát triển kỹ năng"
        categoryLink="/shop?type=COMBO"
        subLinkText="Khám phá gói combo"
        products={catalog.comboProducts}
        badgeColor="bg-[#E91E63]"
        userWishlistIds={userWishlistIds}
      />
      <ProductCarousel
        title="Robot AI giáo dục"
        categoryLink="/shop?type=ROBOT_STEM"
        subLinkText="Robot mBot"
        products={catalog.robotProducts}
        badgeColor="bg-[#FF3300]"
        userWishlistIds={userWishlistIds}
      />
      <ProductCarousel
        title="Đồ chơi tư duy logic"
        categoryLink="/shop?type=DO_CHOI_LOGIC"
        subLinkText="Rubik và xếp hình"
        products={catalog.logicProducts}
        badgeColor="bg-[#F44336]"
        userWishlistIds={userWishlistIds}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomeContent />
    </Suspense>
  );
}
