import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { NewPoForm } from "./components/new-po-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Tạo Phiếu Nhập/Xuất Kho - Admin",
}

export default async function NewInventoryTransactionPage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STORE_MANAGER")) {
    redirect("/")
  }

  // Lấy danh sách sản phẩm để chọn
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      sku: true,
      inventoryCount: true,
      price: true,
      imageUrl: true,
    },
    orderBy: { title: "asc" }
  })

  return (
    <div className="flex-1 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory" className="p-2 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Tạo Phiếu Kho</h2>
          <p className="text-muted-foreground mt-1">
            Ghi nhận giao dịch nhập hàng (PO) hoặc xuất kho.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-sm border border-neutral-200 shadow-sm">
        <NewPoForm products={products} />
      </div>
    </div>
  )
}
