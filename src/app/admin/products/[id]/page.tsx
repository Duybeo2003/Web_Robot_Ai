import { PrismaClient } from "@prisma/client"
import { ProductForm } from "../components/product-form"
import { notFound } from "next/navigation"

const prisma = new PrismaClient()

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Chỉnh sửa sản phẩm</h2>
        <p className="text-muted-foreground">Cập nhật thông tin chi tiết cho sản phẩm: {product.title}</p>
      </div>
      
      <ProductForm initialData={product} />
    </div>
  )
}
