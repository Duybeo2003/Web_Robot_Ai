import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductGallery } from "./components/product-gallery"
import { AddToCartForm } from "./components/add-to-cart-form"
import Link from "next/link"
import { Cpu, ShieldCheck, Wrench, RefreshCcw } from "lucide-react"

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
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-4 text-foreground leading-tight">
            {product.title}
          </h1>
          <div className="text-3xl font-bold text-[#E30019] mb-6">
            {formatPrice(Number(product.price))}
          </div>

          <div className="prose prose-stone max-w-none text-muted-foreground mb-8">
            <p className="text-base leading-relaxed">{product.description}</p>
          </div>

          {/* Dynamic Specs based on ProductType */}
          <div className="mb-8 p-6 bg-white rounded-sm border border-neutral-200 shadow-sm">
            {product.type === 'ROBOT_STEM' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-neutral-200 pb-2 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#FF5722]" /> Tính năng thông minh
                </h3>
                <ul className="space-y-3 text-sm text-neutral-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0" />
                    <span>Tích hợp AI & Lập trình qua khối lệnh (Scratch/Python)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0" />
                    <span>Điều khiển mượt mà qua ứng dụng di động</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0" />
                    <span>Hỗ trợ kết nối IoT và Bluetooth 5.0 khoảng cách xa</span>
                  </li>
                </ul>
              </div>
            )}

            {product.type === 'KIT_ARDUINO' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-neutral-200 pb-2 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#FF5722]" /> Thông số kỹ thuật
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-neutral-500 mb-1">Vi điều khiển</span>
                    <span className="font-medium text-foreground">ATmega328P</span>
                  </div>
                  <div>
                    <span className="block text-neutral-500 mb-1">Điện áp hoạt động</span>
                    <span className="font-medium text-foreground">5V DC</span>
                  </div>
                  <div>
                    <span className="block text-neutral-500 mb-1">Chân I/O</span>
                    <span className="font-medium text-foreground">14 Digital, 6 Analog</span>
                  </div>
                </div>
              </div>
            )}

            {product.type === 'DO_CHOI_LOGIC' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-neutral-200 pb-2 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#FF5722]" /> Đặc điểm nổi bật
                </h3>
                <ul className="space-y-3 text-sm text-neutral-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0" />
                    <span>Chất liệu nhựa ABS nguyên sinh, an toàn tuyệt đối cho trẻ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0" />
                    <span>Thiết kế dạng module dễ dàng tháo lắp và sáng tạo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0" />
                    <span>Kích thích tư duy hình học không gian và logic</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4">
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
    </div>
  )
}
