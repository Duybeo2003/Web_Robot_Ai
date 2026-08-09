import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { cache } from "react"
import { ProductTabs } from "./components/product-tabs"
import { ProductCard } from "@/components/ui/product-card"
import { AddToCartButton } from "../components/add-to-cart-button"
import Link from "next/link"
import { ProductDetailsClient } from "./components/product-details-client"
import { auth } from "@/auth"
import { WishlistButton } from "@/components/ui/wishlist-button"

const getProduct = cache(async (slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: { 
      category: true,
      variants: true,
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    },
  });
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug)

  if (!product) {
    return { title: "Không tìm thấy sản phẩm" }
  }

  const title = `${product.title} - RoboEd`;
  const description = product.description.substring(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
      type: "website",
    }
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug)

  if (!product) {
    notFound()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      type: product.type,
      id: { not: product.id }
    },
    take: 4,
    include: { category: true }
  })

  const session = await auth()
  const userId = session?.user?.id
  
  let isWished = false
  let userWishlistIds: string[] = [];
const sanitizedProduct = { 
  ...product, 
  price: Number(product.price), 
  originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
  variants: product.variants.map((v) => ({
    ...v,
    price: Number(v.price),
    originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
    attributes: v.attributes as Record<string, string>
  }))
};
  
  if (userId) {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true }
    })
    userWishlistIds = wishlistItems.map(w => w.productId)
    isWished = userWishlistIds.includes(product.id)
  }

  const schemaMarkup = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    image: product.imageUrl || "",
    description: product.description.substring(0, 160),
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      url: `https://roboed.vn/shop/${product.slug}`,
      priceCurrency: "VND",
      price: Number(product.price),
      availability:
        Number(product.inventoryCount) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <div className="container mx-auto px-4 py-12 bg-background min-h-screen">
        {/* Breadcrumbs */}
      <div className="mb-8 text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/" className="hover:text-[#FF5722] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#FF5722] transition-colors">Cửa hàng</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.title}</span>
      </div>

      <ProductDetailsClient product={sanitizedProduct} isWished={isWished} />

      <ProductTabs product={sanitizedProduct} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold font-heading mb-8 border-b pb-4 flex items-center justify-between">
            <span className="uppercase tracking-tight text-foreground">Sản phẩm liên quan</span>
            <Link href={`/shop?type=${product.type}`} className="text-sm font-medium text-[#FF5722] hover:underline">
              Xem tất cả
            </Link>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(rp => (
              <ProductCard 
                key={rp.id}
                product={{
                  ...rp,
                  price: Number(rp.price)
                } as unknown as { id: string; title: string; price: number; slug: string; imageUrl: string; supplyType?: string; inventoryCount: number; type: string; category: Record<string, unknown>; isCombo: boolean; flashSaleActive: boolean; flashSalePrice: number | null; flashSaleStock: number | null; variants?: Record<string, unknown>[] }}
                isWished={userWishlistIds.includes(rp.id)}
                action={
                  <AddToCartButton 
                    product={{
                      id: rp.id,
                      title: rp.title,
                      price: Number(rp.price),
                      slug: rp.slug,
                      imageUrl: rp.imageUrl || "",
                    }}
                  />
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
