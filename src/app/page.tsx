import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Ensure fresh data on home page

function ProductCard({ product }: { product: any }) {
  // Mock random discount for UI realism
  const discountPercent = Math.floor(Math.random() * 30) + 10;
  
  return (
    <div className="group relative border border-border bg-white overflow-hidden flex flex-col hover:border-primary hover:shadow-xl transition-all duration-200">
      
      {/* Top Left Badges */}
      <div className="absolute top-0 left-0 z-10 flex flex-col items-start">
        <div className="bg-[#E30019] text-white text-[11px] font-bold px-2 py-0.5 rounded-br-lg rounded-tr-sm shadow-sm">
          Giảm {discountPercent}%
        </div>
        <div className="bg-white/80 backdrop-blur-sm text-[#0066FF] text-[10px] font-medium px-1 mt-0.5">
          Có giảm thêm
        </div>
      </div>

      {/* Top Right Brand Info */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-70">
        <div className="w-4 h-4 bg-orange-500 rounded-full text-white flex items-center justify-center text-[8px] font-bold">R</div>
        <span className="text-[9px] font-bold text-neutral-500 uppercase">RoboEd</span>
      </div>

      {/* Gift Floating Element (Mock) */}
      {product.inventoryCount % 2 !== 0 && (
        <div className="absolute top-1/4 right-2 z-10 flex flex-col items-center">
          <div className="bg-[#AA0000] text-white text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 flex items-center gap-1 shadow-md">
            <span>🎁</span> QUÀ TẶNG
          </div>
        </div>
      )}
      
      {/* Product Image */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-square w-full overflow-hidden block bg-white p-6 mt-4">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
            sizes="(max-width: 768px) 100vw, 250px"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
      </Link>
      
      <div className="p-3 md:p-4 flex flex-col flex-1 border-t border-neutral-100">
        <div className="mb-2">
          <span className="bg-[#3b82f6] text-white text-[10px] font-medium px-1.5 py-0.5 mr-2 inline-block">
            Nhắn tin | Giảm giá thêm
          </span>
        </div>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors text-foreground min-h-[40px] leading-tight">
            {product.title}
          </h3>
        </Link>
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-neutral-400 line-through">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price) * (1 + discountPercent/100))}
            </p>
            <p className="text-base md:text-lg font-bold text-[#E30019]">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price))}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Free Shipping */}
      <div className="w-full bg-[#FF5722] text-white py-1.5 text-center text-[11px] md:text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#E64A19] transition-colors mt-auto">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle></svg>
        Miễn phí giao hàng
      </div>
    </div>
  );
}

export default async function Home() {
  const products = await prisma.product.findMany({
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  const robotProducts = products.filter(p => p.type === 'ROBOT_STEM');
  const kitProducts = products.filter(p => p.type === 'KIT_ARDUINO');
  const logicProducts = products.filter(p => p.type === 'DO_CHOI_LOGIC');

  return (
    <div className="flex flex-col flex-1 bg-[#F5F5F5] pb-20">
      {/* Hero Banner Area */}
      <section className="w-full bg-white pt-4 pb-8">
        <div className="container mx-auto px-4">
          <div className="relative w-full h-[200px] sm:h-[300px] md:h-[450px] rounded-lg overflow-hidden cursor-pointer shadow-sm">
            <Image 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop" // Tech/robotics lab image
              alt="Mừng Khai Trương Robot Thông Minh"
              fill
              priority
              className="object-cover"
            />
            {/* Banner Text Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center px-6 md:px-12">
              <div className="text-white space-y-2 md:space-y-4 max-w-lg">
                <span className="px-2 py-1 bg-[#FF5722] text-[10px] md:text-xs font-bold uppercase rounded-sm inline-block">Khai trương hồng phát</span>
                <h2 className="text-2xl md:text-5xl font-bold leading-tight">ROBOT GIÁO DỤC <br/><span className="text-[#FF5722]">SỐ 1 VIỆT NAM</span></h2>
                <p className="hidden md:block text-base opacity-90">Giảm giá lên đến 50% cho tất cả các bộ Kit STEM và Robot Lập Trình.</p>
                <Button size="sm" className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold px-6 md:h-12 mt-2 md:mt-4 text-xs md:text-base">
                  MUA NGAY
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category: Robot Giáo Dục */}
      {robotProducts.length > 0 && (
        <section className="w-full py-8 bg-white mt-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-sm md:text-lg font-bold text-white bg-[#FF3300] px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide">
                  ROBOT GIÁO DỤC STEM
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/shop/robot-giao-duc" className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
                  Robot mBot
                </Link>
                <Link href="/shop/robot-giao-duc" className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
                  Xem tất cả
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {robotProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category: Kit Arduino */}
      {kitProducts.length > 0 && (
        <section className="w-full py-8 bg-white mt-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-sm md:text-lg font-bold text-white bg-[#FF3300] px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide">
                  KIT TỰ HỌC ARDUINO
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/shop/kit-arduino" className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
                  Arduino Uno
                </Link>
                <Link href="/shop/kit-arduino" className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
                  Xem tất cả
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {kitProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category: Đồ Chơi Logic */}
      {logicProducts.length > 0 && (
        <section className="w-full py-8 bg-white mt-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-sm md:text-lg font-bold text-white bg-[#FF3300] px-4 md:px-6 py-2 rounded-r-full relative -left-4 shadow-sm uppercase tracking-wide">
                  ĐỒ CHƠI TƯ DUY LOGIC
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/shop/do-choi-logic" className="text-xs md:text-sm border border-neutral-300 bg-white text-neutral-700 px-3 md:px-4 py-1.5 rounded-sm hover:border-primary hover:text-primary transition-colors font-medium">
                  Lắp Ráp 3D
                </Link>
                <Link href="/shop/do-choi-logic" className="text-xs md:text-sm bg-[#1A1A1A] text-white px-3 md:px-4 py-1.5 rounded-sm hover:bg-black transition-colors font-medium">
                  Xem tất cả
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {logicProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
