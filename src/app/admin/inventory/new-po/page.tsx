export const dynamic = "force-dynamic";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewPoForm } from "./components/new-po-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tạo phiếu nhập/xuất kho - Admin",
};

export default async function NewInventoryTransactionPage() {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STORE_MANAGER")
  ) {
    redirect("/");
  }

  // Lấy danh sách sản phẩm để chọn
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      sku: true,
      inventoryCount: true,
      variants: {
        select: {
          id: true,
          sku: true,
          attributes: true,
          inventoryCount: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex-1 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/inventory"
          className="rounded-lg border border-neutral-200 bg-white p-2 transition-colors hover:bg-neutral-50"
          aria-label="Quay lại kho hàng"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight sm:text-3xl">
            Tạo phiếu kho
          </h2>
          <p className="text-muted-foreground mt-1">
            Ghi nhận giao dịch nhập hoặc xuất kho.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <NewPoForm products={products} />
      </div>
    </div>
  );
}
