import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Zap, Clock, Package, Edit } from "lucide-react";
import Image from "next/image";
import { removeFlashSale } from "@/actions/product";
import { DeleteButton } from "@/components/delete-button";

export const metadata = {
  title: "Quản lý Flash Sale - Admin",
};

export default async function AdminFlashSalesPage() {
  const flashSales = await prisma.product.findMany({
    where: { flashSaleActive: true },
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
            Chương trình Flash Sale
          </h2>
          <p className="text-muted-foreground mt-1">
            Theo dõi và quản lý tập trung các Sản phẩm/Combo đang chạy giờ vàng.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            Sản phẩm
          </Link>
          <Link
            href="/admin/combos"
            className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            Combo
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-500 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Sản phẩm / Combo</th>
                <th className="px-6 py-4 font-medium">Giá Flash Sale</th>
                <th className="px-6 py-4 font-medium">Kết thúc</th>
                <th className="px-6 py-4 font-medium">Tồn kho / Cấp phát</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flashSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Zap className="w-12 h-12 text-neutral-200" />
                      <p>Không có sản phẩm nào đang chạy Flash Sale.</p>
                      <p className="text-xs text-neutral-400">
                        Vào trang Quản lý Sản phẩm hoặc Combo để kích hoạt Flash Sale.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                flashSales.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative rounded bg-neutral-100 flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 m-auto text-neutral-400 mt-3" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 line-clamp-2">
                            {item.title}
                          </p>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${item.isCombo ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.isCombo ? 'Combo' : 'Sản phẩm'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600">{formatPrice(item.price)}</span>
                        {item.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {formatDate(item.flashSaleEndDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                      <span className="font-medium">{item.flashSaleStock || 0}</span> SLOT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={item.isCombo ? `/admin/combos/${item.id}` : `/admin/products/${item.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Sửa thiết lập Flash Sale"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form action={removeFlashSale.bind(null, item.id)}>
                          <DeleteButton 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                            title="Tắt Flash Sale ngay lập tức" 
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
