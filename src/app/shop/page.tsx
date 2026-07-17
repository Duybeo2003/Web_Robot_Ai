import { prisma } from "@/lib/prisma";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "./components/add-to-cart-button";
import { Search } from "lucide-react";

export const revalidate = 0; // Dynamic page due to searchParams

export const metadata = {
  title: "Cửa hàng - RoboEd",
  description: "Khám phá các sản phẩm Robot giáo dục, Kit Arduino và đồ chơi STEM của chúng tôi.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string, type?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const typeFilter = resolvedParams.type || "";

  let products = [];
  try {
    const whereClause: any = {};
    if (query) {
      whereClause.title = { contains: query };
    }
    if (typeFilter && ['ROBOT_STEM', 'KIT_ARDUINO', 'DO_CHOI_LOGIC'].includes(typeFilter)) {
      whereClause.type = typeFilter;
    }

    products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        imageUrl: true,
        type: true,
        inventoryCount: true,
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database connection failed, using mock data for demo.");
    products = MOCK_PRODUCTS as any;
    if (query || typeFilter) {
      products = products.filter((p: any) => 
        (query ? p.title.toLowerCase().includes(query.toLowerCase()) : true) &&
        (typeFilter ? p.type === typeFilter : true)
      );
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex-1 bg-[#F5F5F5] min-h-screen">
      <div className="mb-8 bg-white p-6 rounded-sm shadow-sm border border-neutral-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-foreground uppercase text-[#FF5722]">
            {typeFilter === 'ROBOT_STEM' ? 'Robot Thông Minh' : 
             typeFilter === 'KIT_ARDUINO' ? 'Kit Arduino' : 
             typeFilter === 'DO_CHOI_LOGIC' ? 'Đồ Chơi Logic' : 'Tất Cả Sản Phẩm'}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Khám phá không gian công nghệ với các dòng Robot thông minh và đồ chơi STEM hàng đầu.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search Form */}
          <form action="/shop" method="GET" className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              name="q"
              defaultValue={query}
              placeholder="Tìm kiếm sản phẩm..." 
              className="w-full h-10 pl-10 pr-4 text-sm border border-neutral-200 rounded-sm focus:outline-none focus:border-[#FF5722]"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          </form>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Link href="/shop">
              <span className={`px-4 py-2 text-xs font-medium rounded-sm border whitespace-nowrap ${!typeFilter ? 'bg-[#FF5722] text-white border-[#FF5722]' : 'bg-white text-neutral-600 border-neutral-200 hover:text-[#FF5722] hover:border-[#FF5722]'}`}>
                Tất cả
              </span>
            </Link>
            <Link href="/shop?type=ROBOT_STEM">
              <span className={`px-4 py-2 text-xs font-medium rounded-sm border whitespace-nowrap ${typeFilter === 'ROBOT_STEM' ? 'bg-[#FF5722] text-white border-[#FF5722]' : 'bg-white text-neutral-600 border-neutral-200 hover:text-[#FF5722] hover:border-[#FF5722]'}`}>
                Robot
              </span>
            </Link>
            <Link href="/shop?type=KIT_ARDUINO">
              <span className={`px-4 py-2 text-xs font-medium rounded-sm border whitespace-nowrap ${typeFilter === 'KIT_ARDUINO' ? 'bg-[#FF5722] text-white border-[#FF5722]' : 'bg-white text-neutral-600 border-neutral-200 hover:text-[#FF5722] hover:border-[#FF5722]'}`}>
                Kit Arduino
              </span>
            </Link>
            <Link href="/shop?type=DO_CHOI_LOGIC">
              <span className={`px-4 py-2 text-xs font-medium rounded-sm border whitespace-nowrap ${typeFilter === 'DO_CHOI_LOGIC' ? 'bg-[#FF5722] text-white border-[#FF5722]' : 'bg-white text-neutral-600 border-neutral-200 hover:text-[#FF5722] hover:border-[#FF5722]'}`}>
                Logic
              </span>
            </Link>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-sm border border-neutral-100">
          <p className="text-neutral-500 font-medium">Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn.</p>
          <Link href="/shop" className="text-[#FF5722] hover:underline text-sm mt-2 inline-block">Xóa bộ lọc</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {products.map((product: any) => {
            const discountPercent = Math.floor(Math.random() * 30) + 10;
            return (
              <div key={product.id} className="group relative border border-border bg-white overflow-hidden flex flex-col hover:border-[#FF5722] hover:shadow-xl transition-all duration-200">
                
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
                {(product.inventoryCount || 0) % 2 !== 0 && (
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
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <p className="text-xs text-neutral-400 line-through">
                        {formatPrice(Number(product.price) * (1 + discountPercent/100))}
                      </p>
                      <p className="text-base md:text-lg font-bold text-[#E30019]">
                        {formatPrice(Number(product.price))}
                      </p>
                    </div>
                    
                    <AddToCartButton 
                      product={{
                        id: product.id,
                        title: product.title,
                        price: Number(product.price),
                        slug: product.slug,
                        imageUrl: product.imageUrl || "",
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
