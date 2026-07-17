import { prisma } from "@/lib/prisma";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "./components/add-to-cart-button";
import { ProductCard } from "@/components/ui/product-card";
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
            return (
              <ProductCard 
                key={product.id}
                product={product} 
                action={
                  <AddToCartButton 
                    product={{
                      id: product.id,
                      title: product.title,
                      price: Number(product.price),
                      slug: product.slug,
                      imageUrl: product.imageUrl || "",
                    }}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
