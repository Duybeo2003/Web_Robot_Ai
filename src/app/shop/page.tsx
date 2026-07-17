import { prisma } from "@/lib/prisma";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "./components/add-to-cart-button";

export const revalidate = 3600; // Cache for 1 hour

export const metadata = {
  title: "Cửa hàng - RoboEd",
  description: "Khám phá các sản phẩm robot, dinh dưỡng và khoá học của chúng tôi.",
};

export default async function ShopPage() {
  let products = [];
  try {
    products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        imageUrl: true,
        type: true,
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database connection failed, using mock data for demo.");
    products = MOCK_PRODUCTS as any;
  }

  if (products.length === 0) {
    products = MOCK_PRODUCTS as any;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-12 flex-1 bg-background">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Cửa hàng</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Tinh giản không gian và nuôi dưỡng cơ thể với các sản phẩm giáo dục và dinh dưỡng chất lượng cao của chúng tôi.
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <div key={product.id} className="group relative border border-stone-200 rounded-sm bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <Link href={`/shop/${product.slug}`} className="relative h-64 w-full overflow-hidden block">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-heading text-xl">
                  RoboEd
                </div>
              )}
              {product.type === "DIGITAL" && (
                <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-sm shadow-sm">
                  Sản phẩm Số
                </div>
              )}
            </Link>
            
            <div className="p-6 flex flex-col flex-1 bg-card">
              <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-widest">
                {product.category?.name || "Khác"}
              </div>
              <Link href={`/shop/${product.slug}`}>
                <h3 className="text-lg font-heading font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">
                  {product.title}
                </h3>
              </Link>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(Number(product.price))}
                </span>
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
        ))}
      </div>
    </div>
  );
}
