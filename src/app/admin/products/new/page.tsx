import { PrismaClient } from "@prisma/client";
import { ProductForm } from "../components/product-form";

const prisma = new PrismaClient();

export const metadata = {
  title: "Thêm sản phẩm mới - Admin",
};

export default async function NewProductPage() {
  const [categories, availableProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isCombo: false },
      select: { id: true, title: true, price: true, imageUrl: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const serializedAvailableProducts = availableProducts.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Thêm sản phẩm mới</h2>
        <p className="text-muted-foreground">
          Tạo một sản phẩm mới trong hệ thống.
        </p>
      </div>

      <ProductForm
        categories={serializedCategories}
        availableProducts={serializedAvailableProducts}
      />
    </div>
  );
}
