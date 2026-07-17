import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductGallery } from "./components/product-gallery"
import { AddToCartForm } from "./components/add-to-cart-form"
import Link from "next/link"
import { Leaf, ShieldCheck, RefreshCcw } from "lucide-react"

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
    include: { category: true },
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

  return (
    <div className="container mx-auto px-4 py-12 bg-background">
      {/* Breadcrumbs */}
      <div className="mb-8 text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-primary transition-colors">Cửa hàng</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <ProductGallery imageUrl={product.imageUrl} title={product.title} />

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-secondary mb-3 uppercase tracking-widest">
            {product.category?.name || "Sản phẩm"}
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4 text-foreground leading-tight">
            {product.title}
          </h1>
          <div className="text-3xl font-bold text-foreground mb-6">
            {formatPrice(Number(product.price))}
          </div>

          <div className="prose prose-stone max-w-none text-muted-foreground mb-8">
            <p className="text-lg leading-relaxed">{product.description}</p>
          </div>

          {/* Dynamic Specs based on ProductType */}
          <div className="mb-8 p-6 bg-card rounded-sm border border-border">
            {product.type === 'ROBOT_STEM' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-stone-200 pb-2">Tính năng thông minh</h3>
                <ul className="space-y-2 text-sm text-[#2C2C2C]/80">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C86B5A] mt-1.5 shrink-0" />
                    <span>Tích hợp AI & lập trình qua khối lệnh (Scratch)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C86B5A] mt-1.5 shrink-0" />
                    <span>Điều khiển qua ứng dụng di động</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C86B5A] mt-1.5 shrink-0" />
                    <span>Kết nối IoT và Bluetooth 5.0</span>
                  </li>
                </ul>
              </div>
            )}

            {product.type === 'KIT_ARDUINO' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-stone-200 pb-2">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-[#2C2C2C]/60">Vi điều khiển</span>
                    <span className="font-medium">ATmega328P</span>
                  </div>
                  <div>
                    <span className="block text-[#2C2C2C]/60">Điện áp hoạt động</span>
                    <span className="font-medium">5V DC</span>
                  </div>
                  <div>
                    <span className="block text-[#2C2C2C]/60">Chân I/O</span>
                    <span className="font-medium">14 Digital, 6 Analog</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
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

          {/* Trust Indicators */}
          <div className="mt-8 pt-8 border-t border-border/50 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Leaf className="w-5 h-5 text-secondary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">100% Tự nhiên</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 border-l border-r border-border/50 px-2">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Bảo mật SSL</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <RefreshCcw className="w-5 h-5 text-secondary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Đổi trả 7 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
