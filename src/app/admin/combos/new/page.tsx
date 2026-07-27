import { ProductForm } from "@/app/admin/products/components/product-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Tạo Gói Combo - Admin",
};

export default async function NewComboPage() {
  const [categories, availableProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isCombo: false }, // Only allow selecting non-combo products as items
      orderBy: { title: "asc" },
    }),
  ]);

  const serializedAvailableProducts = availableProducts.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-indigo-700">
          Tạo Gói Combo Mới
        </h2>
        <p className="text-muted-foreground">
          Thêm một gói bán gộp các đồ chơi lại với nhau.
        </p>
      </div>

      <ProductForm
        categories={categories}
        availableProducts={serializedAvailableProducts}
        forceComboMode={true}
      />
    </div>
  );
}
