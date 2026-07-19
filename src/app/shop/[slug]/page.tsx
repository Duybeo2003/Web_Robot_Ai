import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductGallery } from "./components/product-gallery"
import { AddToCartForm } from "./components/add-to-cart-form"
import { ProductTabs } from "./components/product-tabs"
import { PromotionalBanner } from "./components/promotional-banner"
import { ProductCard } from "@/components/ui/product-card"
import { AddToCartButton } from "../components/add-to-cart-button"
import Link from "next/link"
import { Cpu, ShieldCheck, Wrench, RefreshCcw } from "lucide-react"
import { auth } from "@/auth"
import { WishlistButton } from "@/components/ui/wishlist-button"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
  })

  if (!product) {
    return { title: "Không tìm thấy sản phẩm" }
  }

  return {
    title: `${product.title} - RoboEd`,
    description: product.description.substring(0, 160),
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    include: { 
      category: true,
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    },
  })

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
const sanitizedProduct = { ...product, price: Number(product.price), originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined };
  
  if (userId) {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true }
    })
    userWishlistIds = wishlistItems.map(w => w.productId)
    isWished = userWishlistIds.includes(product.id)
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-background min-h-screen">
      {/* Breadcrumbs */}
      <div className="mb-8 text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/" className="hover:text-[#FF5722] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#FF5722] transition-colors">Cửa hàng</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <ProductGallery imageUrl={product.imageUrl} title={product.title} />

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="text-sm font-bold text-[#FF5722] mb-3 uppercase tracking-widest bg-[#FF5722]/10 inline-block px-3 py-1 rounded-sm self-start">
            {product.category?.name || "Sản phẩm Mới"}
          </div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground leading-tight">
              {product.title}
            </h1>
            <div className="shrink-0 flex items-center justify-center p-2 rounded-full border border-neutral-200 ml-4 relative hover:border-[#FF5722] transition-colors">
               <div className="absolute inset-0"></div>
               <WishlistButton productId={product.id} initiallyWished={isWished} />
            </div>
          </div>
          <PromotionalBanner 
            isActive={product.flashSaleActive}
            endDate={product.flashSaleEndDate}
            stock={product.flashSaleStock}
          />

          <div className="flex flex-wrap items-end gap-3 md:gap-4 mb-4">
            <div className="text-3xl font-bold text-[#E30019]">
              {formatPrice(Number(product.price))}
            </div>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <>
                <div className="text-base md:text-lg text-neutral-400 line-through mb-1 font-medium">
                  {formatPrice(Number(product.originalPrice))}
                </div>
                <div className="bg-[#E30019] text-white text-xs font-bold px-2 py-1 rounded-sm mb-1.5 uppercase shadow-sm">
                  Giảm {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                </div>
              </>
            )}
          </div>

          <div className="mb-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Tình trạng:</span>
              <span className={`font-medium ${product.inventoryCount > 0 ? "text-green-600" : "text-red-500"}`}>
                {product.inventoryCount > 0 ? `Còn hàng (${product.inventoryCount})` : "Hết hàng"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Vận chuyển:</span>
              <span className="font-medium text-foreground">Miễn phí giao hàng toàn quốc</span>
            </div>
          </div>

          <div className="prose prose-sm text-muted-foreground mb-8 line-clamp-3">
            {product.description}
          </div>

          <div className="mt-2">
            <AddToCartForm 
              product={{
                id: product.id,
                title: product.title,
                price: Number(product.price),
                slug: product.slug,
                imageUrl: product.imageUrl || "",
              }} 
            />
          </div>

          {/* Trust Indicators for Tech products */}
          <div className="mt-8 pt-8 border-t border-border/50 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#FF5722]" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bảo hành 12 tháng</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 border-l border-r border-border/50 px-2">
              <RefreshCcw className="w-6 h-6 text-[#FF5722]" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">1 đổi 1 trong 7 ngày</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Wrench className="w-6 h-6 text-[#FF5722]" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hỗ trợ kỹ thuật 24/7</span>
            </div>
          </div>
        </div>
      </div>

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
                } as any}
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
  )
}
