import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/ui/product-card"
import { AddToCartButton } from "@/app/shop/components/add-to-cart-button"
import { Search } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Sản phẩm yêu thích - RoboEd",
}

export default async function WishlistPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-neutral-100 min-h-[500px]">
      <h1 className="text-xl font-bold uppercase mb-6 pb-4 border-b border-neutral-100">
        Sản phẩm yêu thích
      </h1>

      {wishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium text-lg mb-2">Chưa có sản phẩm yêu thích</p>
          <p className="text-neutral-500 text-sm mb-6">Hãy thêm những món đồ chơi yêu thích để dễ dàng mua sau nhé.</p>
          <Link href="/shop" className="px-6 py-2 bg-[#FF5722] text-white rounded-sm font-medium hover:bg-[#E64A19] transition-colors">
            Khám phá Cửa hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {wishlists.map((w) => (
            <ProductCard 
              key={w.productId}
              product={w.product as any}
              isWished={true}
              action={
                <AddToCartButton 
                  product={{
                    id: w.product.id,
                    title: w.product.title,
                    price: Number(w.product.price),
                    slug: w.product.slug,
                    imageUrl: w.product.imageUrl || "",
                  }}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
