import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "@/app/admin/products/components/product-form";

export const metadata = {
  title: "Chỉnh sửa Gói Combo - Admin",
};

export default async function EditComboPage({
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
            product: true,
          },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isCombo: false }, // Only allow selecting non-combo products as items
      orderBy: { title: "asc" },
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Ensure it's a combo
  if (!product.isCombo) {
    notFound();
  }

  const serializedProduct = JSON.parse(JSON.stringify(product));
  const serializedAvailableProducts = JSON.parse(JSON.stringify(availableProducts));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-indigo-700">
          Chỉnh sửa Gói Combo
        </h2>
        <p className="text-muted-foreground">
          Cập nhật thông tin chi tiết cho gói combo: {product.title}
        </p>
      </div>

      <ProductForm
        initialData={serializedProduct}
        categories={categories}
        availableProducts={serializedAvailableProducts}
        forceComboMode={true}
      />
    </div>
  );
}
