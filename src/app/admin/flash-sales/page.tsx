import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Zap, Clock, Package, Edit } from "lucide-react";
import Image from "next/image";
import { removeFlashSale } from "@/actions/product";
import { DeleteButton } from "@/components/delete-button";

export const metadata = {
  title: "Quản lý ưu đãi nhanh - Admin",
};

export default async function AdminFlashSalesPage() {
  const flashSales = await prisma.product.findMany({
    where: { flashSaleActive: true, deletedAt: null },
    orderBy: { flashSaleEndDate: "asc" },
    select: {
      id: true,
      title: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      isCombo: true,
      flashSaleEndDate: true,
      flashSaleStock: true,
    },
  });

  const formatPrice = (price: number | string | null | undefined) => {
    if (price == null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Không giới hạn";
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-yellow-500 flex items-center gap-2">
            <Zap className="w-6 h-6" fill="currentColor" />
            Chương trình ưu đãi nhanh
          </h2>
          <p className="text-muted-foreground mt-1">
            Theo dõi sản phẩm và combo đang áp dụng giá ưu đãi trong thời gian giới hạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="flex h-10 items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            Sản phẩm
          </Link>
          <Link
            href="/admin/combos"
            className="flex h-10 items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            Combo
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm md:table-auto">
            <thead className="bg-neutral-50 text-neutral-500 border-b">
              <tr>
                <th className="px-3 py-4 font-medium sm:px-6">Sản phẩm hoặc combo</th>
                <th className="hidden px-6 py-4 font-medium md:table-cell">Giá ưu đãi</th>
                <th className="hidden px-6 py-4 font-medium lg:table-cell">Kết thúc</th>
                <th className="hidden px-6 py-4 font-medium md:table-cell">Số lượng</th>
                <th className="w-20 px-2 py-4 text-right font-medium sm:w-24 sm:px-4 md:w-auto md:px-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flashSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Zap className="w-12 h-12 text-neutral-200" />
                      <p>Không có sản phẩm nào đang áp dụng ưu đãi nhanh.</p>
                      <p className="text-xs text-neutral-400">
                        Mở trang sản phẩm hoặc combo để thiết lập chương trình.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                flashSales.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="min-w-0 px-3 py-4 sm:px-6">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 relative rounded bg-neutral-100 flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 m-auto text-neutral-400 mt-3" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 line-clamp-2">
                            {item.title}
                          </p>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${item.isCombo ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.isCombo ? 'Combo' : 'Sản phẩm'}
                          </span>
                          <div className="mt-2 space-y-1 md:hidden">
                            <div className="font-bold text-red-600">{formatPrice(Number(item.price))}</div>
                            <div className="flex items-center gap-1 text-xs text-neutral-500">
                              <Clock className="h-3.5 w-3.5 text-orange-500" />
                              {formatDate(item.flashSaleEndDate)}
                            </div>
                            <div className="text-xs text-neutral-500">Còn {item.flashSaleStock || 0} suất</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600">{formatPrice(Number(item.price))}</span>
                        {item.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(Number(item.originalPrice))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-neutral-600 lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {formatDate(item.flashSaleEndDate)}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-neutral-600 md:table-cell">
                      <span className="font-medium">{item.flashSaleStock || 0}</span> suất
                    </td>
                    <td className="w-20 px-1 py-4 text-right sm:w-24 sm:px-3 md:w-auto md:px-6">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Link
                          href={item.isCombo ? `/admin/combos/${item.id}` : `/admin/products/${item.id}`}
                          className="flex size-9 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                          title="Sửa thiết lập ưu đãi"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form action={removeFlashSale.bind(null, item.id)}>
                          <DeleteButton 
                            className="flex size-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                            title="Tắt ưu đãi ngay"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
