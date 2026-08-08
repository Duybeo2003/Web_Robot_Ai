import { prisma } from "@/lib/prisma";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Link from "next/link";
import { Prisma, AgeRange, PrimarySkill } from "@prisma/client";
import { AddToCartButton } from "./components/add-to-cart-button";
import { ProductCard } from "@/components/ui/product-card";
import { Search } from "lucide-react";
import { SortForm } from "./components/sort-form";
import { ShopSidebarFilters } from "./components/shop-sidebar-filters";
import { auth } from "@/auth";


export const metadata = {
  title: "Cửa hàng - RoboEd",
  description:
    "Khám phá các sản phẩm Robot giáo dục, Kit Arduino và đồ chơi STEM của chúng tôi.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    minAge?: string;
    maxAge?: string;
    skill?: string;
    sort?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const typeFilter = resolvedParams.type || "";
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const minPrice = resolvedParams.minPrice
    ? Number(resolvedParams.minPrice)
    : undefined;
  const maxPrice = resolvedParams.maxPrice
    ? Number(resolvedParams.maxPrice)
    : undefined;
  const sortOption = resolvedParams.sort || "newest";
  const skillFilter = resolvedParams.skill || "";
  const minAge = resolvedParams.minAge ? Number(resolvedParams.minAge) : undefined;
  const maxAge = resolvedParams.maxAge ? Number(resolvedParams.maxAge) : undefined;
  const itemsPerPage = 12;

  const session = await auth();
  const userId = session?.user?.id;

  type ShopProduct = Omit<Prisma.ProductGetPayload<{
    select: {
      id: true;
      title: true;
      slug: true;
      price: true;
      imageUrl: true;
      type: true;
      inventoryCount: true;
      category: { select: { name: true } };
    };
  }>, "price"> & { price: number };
  
  let products: ShopProduct[] = [];
  let totalCount = 0;
  let userWishlistIds: string[] = [];

  try {
    const whereClause: Prisma.ProductWhereInput = {};
    if (query) {
      whereClause.title = { contains: query };
    }
    if (
      typeFilter &&
      ["ROBOT_STEM", "DO_CHOI_LOGIC", "COMBO"].includes(typeFilter)
    ) {
      if (typeFilter === "COMBO") {
        whereClause.isCombo = true;
      } else {
        whereClause.type = typeFilter as Prisma.EnumProductTypeFilter<"Product">;
      }
    }
    if (minAge !== undefined || maxAge !== undefined) {
      const minA = minAge ?? 3;
      const maxA = maxAge ?? 18;
      const ageEnumMatches: AgeRange[] = [];
      
      if (minA <= 5 && maxA >= 3) ageEnumMatches.push("AGE_3_5");
      if (minA <= 8 && maxA >= 6) ageEnumMatches.push("AGE_6_8");
      if (minA <= 12 && maxA >= 9) ageEnumMatches.push("AGE_9_12");
      if (maxA >= 12) ageEnumMatches.push("AGE_12_PLUS");

      if (ageEnumMatches.length > 0) {
        whereClause.ageRange = { in: ageEnumMatches };
      }
    }
    if (skillFilter) {
      whereClause.primarySkill = skillFilter as PrimarySkill;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) whereClause.price.gte = minPrice;
      if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sortOption === "price_asc") {
      orderByClause = { price: "asc" };
    } else if (sortOption === "price_desc") {
      orderByClause = { price: "desc" };
    }

    const [fetchedProducts, count] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          originalPrice: true,
          imageUrl: true,
          type: true,
          supplyType: true,
          inventoryCount: true,
          category: {
            select: { name: true },
          },
        },
        orderBy: orderByClause,
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    products = fetchedProducts.map((p) => ({ ...p, price: Number(p.price) }));
    totalCount = count;

    if (userId) {
      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
      });
      userWishlistIds = wishlistItems.map((w) => w.productId);
    }
  } catch {
    console.error("Database connection failed, using mock data for demo.");
    products = MOCK_PRODUCTS as unknown as typeof products;
    if (query || typeFilter) {
      products = products.filter(
        (p) =>
          (query
            ? p.title.toLowerCase().includes(query.toLowerCase())
            : true) && (typeFilter ? p.type === typeFilter : true),
      );
    }
    totalCount = products.length;
    products = products.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);


  return (
    <div className="container mx-auto px-4 py-8 flex-1 bg-[#F5F5F5] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <ShopSidebarFilters />


        </div>

        {/* Main Product Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase text-[#FF5722]">
                {typeFilter === "ROBOT_STEM"
                  ? "Robot Thông Minh"
                  : typeFilter === "KIT_ARDUINO"
                    ? "Kit Arduino"
                    : typeFilter === "DO_CHOI_LOGIC"
                      ? "Đồ Chơi Logic"
                      : "Tất Cả Sản Phẩm"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Hiển thị {products.length} sản phẩm
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-600 hidden md:inline-block">
                Sắp xếp theo:
              </span>
              <SortForm
                query={query}
                typeFilter={typeFilter}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sortOption={sortOption}
              />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-sm border border-neutral-100 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-medium text-lg mb-2">
                Không tìm thấy sản phẩm nào
              </p>
              <p className="text-neutral-500 text-sm mb-6">
                Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc.
              </p>
              <Link
                href="/shop"
                className="px-6 py-2 bg-[#FF5722] text-white rounded-sm font-medium hover:bg-[#E64A19] transition-colors"
              >
                Xóa bộ lọc
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {products.map((product) => {
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWished={userWishlistIds.includes(product.id)}
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

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8">
                  {currentPage > 1 && (
                    <Link
                      href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), page: (currentPage - 1).toString() }).toString()}`}
                      className="px-4 py-2 border border-neutral-200 rounded-sm text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Trang trước
                    </Link>
                  )}

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      // Simple logic to show nearby pages
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <Link
                            key={pageNum}
                            href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), page: pageNum.toString() }).toString()}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-[#FF5722] text-white border border-[#FF5722]"
                                : "bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span
                            key={pageNum}
                            className="w-10 h-10 flex items-center justify-center text-neutral-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {currentPage < totalPages && (
                    <Link
                      href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), page: (currentPage + 1).toString() }).toString()}`}
                      className="px-4 py-2 border border-neutral-200 rounded-sm text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Trang sau
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
