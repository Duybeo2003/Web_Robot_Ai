import { prisma } from "@/lib/prisma";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AddToCartButton } from "./components/add-to-cart-button";
import { ProductCard } from "@/components/ui/product-card";
import { Search } from "lucide-react";
import { SortForm } from "./components/sort-form";

import { auth } from "@/auth";

export const revalidate = 0; // Dynamic page due to searchParams

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
  const ageFilter = (resolvedParams as { age?: string }).age || "";
  const skillFilter = (resolvedParams as { skill?: string }).skill || "";
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
    if (ageFilter) {
      whereClause.ageRange = ageFilter as Prisma.EnumAgeRangeFilter<"Product">;
    }
    if (skillFilter) {
      whereClause.primarySkill = skillFilter as Prisma.EnumSkillFilter<"Product">;
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
          imageUrl: true,
          type: true,
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
          <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
            <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
              Tìm kiếm
            </h2>
            <form action="/shop" method="GET" className="relative mb-6">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Nhập tên sản phẩm..."
                className="w-full h-10 pl-10 pr-4 text-sm border border-neutral-200 rounded-sm focus:outline-none focus:border-[#FF5722]"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              {typeFilter && (
                <input type="hidden" name="type" value={typeFilter} />
              )}
            </form>

            <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
              Danh mục
            </h2>
            <div className="flex flex-col space-y-2 mb-8">
              <Link
                href="/shop"
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${!typeFilter ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Tất cả sản phẩm
              </Link>
              <Link
                href="/shop?type=ROBOT_STEM"
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${typeFilter === "ROBOT_STEM" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Robot Giáo Dục
              </Link>
              <Link
                href="/shop?type=DO_CHOI_LOGIC"
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${typeFilter === "DO_CHOI_LOGIC" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Đồ Chơi Logic
              </Link>
              <Link
                href="/shop?type=COMBO"
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${typeFilter === "COMBO" ? "bg-red-100 text-red-600" : "text-red-500 hover:bg-red-50"}`}
              >
                Combo Tiết Kiệm
              </Link>
            </div>

            <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
              Độ tuổi
            </h2>
            <div className="flex flex-col space-y-2 mb-8">
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(skillFilter && { skill: skillFilter }) }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${!ageFilter ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Tất cả độ tuổi
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(skillFilter && { skill: skillFilter }), age: "AGE_3_5" }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${ageFilter === "AGE_3_5" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                3 - 5 Tuổi
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(skillFilter && { skill: skillFilter }), age: "AGE_6_8" }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${ageFilter === "AGE_6_8" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                6 - 8 Tuổi
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(skillFilter && { skill: skillFilter }), age: "AGE_9_12" }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${ageFilter === "AGE_9_12" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                9 - 12 Tuổi
              </Link>
            </div>

            <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
              Kỹ năng
            </h2>
            <div className="flex flex-col space-y-2 mb-8">
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(ageFilter && { age: ageFilter }) }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${!skillFilter ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Tất cả kỹ năng
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(ageFilter && { age: ageFilter }), skill: "LOGIC" }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${skillFilter === "LOGIC" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Tư duy Logic
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(ageFilter && { age: ageFilter }), skill: "EQ" }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${skillFilter === "EQ" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Phát triển EQ
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(ageFilter && { age: ageFilter }), skill: "LANGUAGE" }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${skillFilter === "LANGUAGE" ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Ngoại ngữ
              </Link>
            </div>

            <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
              Mức giá
            </h2>
            <div className="flex flex-col space-y-2">
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), ...(sortOption !== "newest" && { sort: sortOption }) }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${!minPrice && !maxPrice ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Tất cả mức giá
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), maxPrice: "500000", ...(sortOption !== "newest" && { sort: sortOption }) }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${maxPrice === 500000 && !minPrice ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Dưới 500.000₫
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), minPrice: "500000", maxPrice: "1000000", ...(sortOption !== "newest" && { sort: sortOption }) }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${minPrice === 500000 && maxPrice === 1000000 ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                500.000₫ - 1.000.000₫
              </Link>
              <Link
                href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), minPrice: "1000000", ...(sortOption !== "newest" && { sort: sortOption }) }).toString()}`}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${minPrice === 1000000 && !maxPrice ? "bg-[#FF5722]/10 text-[#FF5722]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                Trên 1.000.000₫
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
            <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
              Cam kết RoboEd
            </h2>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722]"></div>
                <span>Chính hãng 100%</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722]"></div>
                <span>Bảo hành 12 tháng</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722]"></div>
                <span>Đổi trả miễn phí 7 ngày</span>
              </li>
            </ul>
          </div>
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
