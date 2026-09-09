import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import { AddToCartButton } from "@/app/shop/components/add-to-cart-button";
import { Search } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Sản phẩm yêu thích - RoboEQ",
};

export default async function WishlistPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { userId, product: { deletedAt: null } },
    select: {
      productId: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          originalPrice: true,
          imageUrl: true,
          supplyType: true,
          depositPercent: true,
          inventoryCount: true,
          _count: { select: { variants: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="min-h-[500px] rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
      <h1 className="mb-6 border-b border-neutral-100 pb-4 text-2xl font-bold">
        Sản phẩm yêu thích
      </h1>

      {wishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium text-lg mb-2">
            Chưa có sản phẩm yêu thích
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            Hãy thêm những món đồ chơi yêu thích để dễ dàng mua sau nhé.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-6 font-bold text-white transition-colors hover:bg-primary/90"
          >
            Khám phá cửa hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {wishlists.map((w) => (
            <ProductCard
              key={w.productId}
              product={{
                ...w.product,
                price: Number(w.product.price),
                originalPrice: w.product.originalPrice ? Number(w.product.originalPrice) : null,
              }}
              isWished={true}
              action={
                <AddToCartButton
                  product={{
                    id: w.product.id,
                    title: w.product.title,
                    price: Number(w.product.price),
                    slug: w.product.slug,
                    imageUrl: w.product.imageUrl || "",
                    supplyType: w.product.supplyType,
                    depositPercent: w.product.depositPercent || undefined,
                    inventoryCount: w.product.inventoryCount,
                    hasVariants: w.product._count.variants > 0,
                  }}
                />
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
