import { PrismaClient } from "@prisma/client";
import { ProductForm } from "../components/product-form";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const [product, categories, availableProducts] = await Promise.all([
    prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: {
        comboItems: {
          include: {
            product: { select: { title: true, price: true, imageUrl: true } },
          },
        },
        variants: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isCombo: false, id: { not: resolvedParams.id } },
      select: { id: true, title: true, price: true, imageUrl: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const serializedProduct = JSON.parse(JSON.stringify(product));
  const serializedAvailableProducts = JSON.parse(JSON.stringify(availableProducts));

  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Chỉnh sửa sản phẩm
        </h2>
        <p className="text-muted-foreground">
          Cập nhật thông tin chi tiết cho sản phẩm: {product.title}
        </p>
      </div>

      <ProductForm
        initialData={serializedProduct}
        categories={serializedCategories}
        availableProducts={serializedAvailableProducts}
      />
    </div>
  );
}
