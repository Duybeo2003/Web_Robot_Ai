import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma, AgeRange, PrimarySkill } from "@prisma/client";
import { AddToCartButton } from "./components/add-to-cart-button";
import { ProductCard } from "@/components/ui/product-card";
import { Search } from "lucide-react";
import { SortForm } from "./components/sort-form";
import { ShopSidebarFilters } from "./components/shop-sidebar-filters";
import { auth } from "@/auth";

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boundedNumber(
  value: string | string[] | undefined,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(firstSearchValue(value));
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

export const metadata = {
  title: "Cửa hàng - RoboEQ",
  description:
    "Khám phá các sản phẩm Robot giáo dục, Kit Arduino và đồ chơi STEM của chúng tôi.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
    page?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    minAge?: string | string[];
    maxAge?: string | string[];
    skill?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const resolvedParams = await searchParams;
  const query = (firstSearchValue(resolvedParams.q) || "").trim().slice(0, 100);
  const requestedType = firstSearchValue(resolvedParams.type) || "";
  const typeFilter = ["ROBOT_STEM", "KIT_ARDUINO", "DO_CHOI_LOGIC", "COMBO"].includes(
    requestedType,
  )
    ? requestedType
    : "";
  const requestedPage = boundedNumber(resolvedParams.page, 1, 1_000);
  const currentPage = requestedPage ? Math.floor(requestedPage) : 1;
  const minPrice = boundedNumber(resolvedParams.minPrice, 0, 1_000_000_000);
  const maxPrice = boundedNumber(resolvedParams.maxPrice, 0, 1_000_000_000);
  const requestedSort = firstSearchValue(resolvedParams.sort) || "newest";
  const sortOption = ["newest", "price_asc", "price_desc"].includes(requestedSort)
    ? requestedSort
    : "newest";
  const requestedSkill = firstSearchValue(resolvedParams.skill) || "";
  const skillFilter = ["LOGIC", "LANGUAGE", "MOTOR_SKILLS", "EQ"].includes(
    requestedSkill,
  )
    ? requestedSkill
    : "";
  const minAge = boundedNumber(resolvedParams.minAge, 0, 100);
  const maxAge = boundedNumber(resolvedParams.maxAge, 0, 100);
  const itemsPerPage = 12;

  const session = await auth();
  const userId = session?.user?.id;

  type ShopProduct = Omit<Prisma.ProductGetPayload<{
    select: {
      id: true;
      title: true;
      slug: true;
      price: true;
      originalPrice: true;
      imageUrl: true;
      type: true;
      supplyType: true;
      depositPercent: true;
      inventoryCount: true;
      _count: { select: { variants: true } };
      category: { select: { name: true } };
    };
  }>, "price" | "originalPrice"> & { price: number; originalPrice: number | null };
  
  let products: ShopProduct[] = [];
  let totalCount = 0;
  let userWishlistIds: string[] = [];

  try {
    const whereClause: Prisma.ProductWhereInput = { deletedAt: null };
    if (query) {
      whereClause.title = { contains: query };
    }
    if (
      typeFilter &&
      ["ROBOT_STEM", "KIT_ARDUINO", "DO_CHOI_LOGIC", "COMBO"].includes(typeFilter)
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
    if (
      skillFilter &&
      ["LOGIC", "LANGUAGE", "MOTOR_SKILLS", "EQ"].includes(skillFilter)
    ) {
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
          depositPercent: true,
          inventoryCount: true,
          _count: { select: { variants: true } },
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

    products = fetchedProducts.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }));
    totalCount = count;

    if (userId) {
      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
      });
      userWishlistIds = wishlistItems.map((w) => w.productId);
    }
  } catch (error) {
    console.error("[SHOP_QUERY_ERROR]", error);
    throw error;
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);


  return (
    <div className="container mx-auto min-h-screen flex-1 px-4 py-6 sm:py-10">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        {/* Left Sidebar Filters */}
        <aside className="space-y-6">
          <ShopSidebarFilters />
        </aside>

        {/* Main Product Area */}
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
                {typeFilter === "ROBOT_STEM"
                  ? "Robot thông minh"
                  : typeFilter === "KIT_ARDUINO"
                    ? "Kit Arduino"
                    : typeFilter === "DO_CHOI_LOGIC"
                      ? "Đồ chơi logic"
                      : typeFilter === "COMBO"
                        ? "Combo tiết kiệm"
                        : "Tất cả sản phẩm"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Hiển thị {products.length} trên {totalCount} sản phẩm
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-10 text-center shadow-sm sm:p-12">
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
                className="inline-flex h-10 items-center rounded-lg bg-primary px-6 font-semibold text-white transition-colors hover:bg-secondary"
              >
                Xóa bộ lọc
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3">
                {products.map((product, index) => {
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      eager={index === 0}
                      isWished={userWishlistIds.includes(product.id)}
                      action={
                        <AddToCartButton
                          product={{
                            id: product.id,
                            title: product.title,
                            price: Number(product.price),
                            slug: product.slug,
                            imageUrl: product.imageUrl || "",
                            supplyType: product.supplyType,
                            depositPercent: product.depositPercent,
                            inventoryCount: product.inventoryCount,
                            hasVariants: product._count.variants > 0,
                          }}
                        />
                      }
                    />
                  );
                })}
              </div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <nav aria-label="Phân trang sản phẩm" className="flex flex-wrap items-center justify-center gap-2 pt-6 sm:pt-8">
                  {currentPage > 1 && (
                    <Link
                      href={`/shop?${new URLSearchParams({ ...(query && { q: query }), ...(typeFilter && { type: typeFilter }), page: (currentPage - 1).toString() }).toString()}`}
                      className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
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
                            className={`flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
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
                            className="flex size-10 items-center justify-center text-neutral-400"
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
                      className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                    >
                      Trang sau
                    </Link>
                  )}
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
