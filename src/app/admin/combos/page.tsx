import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Layers } from "lucide-react";
import { deleteProduct } from "@/actions/product";

export const metadata = {
  title: "Quản lý Combo - Admin",
};

export default async function AdminCombosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const itemsPerPage = 10;

  const whereClause: { isCombo: boolean; title?: { contains: string } } = { isCombo: true };
  if (query) {
    whereClause.title = { contains: query };
  }

  const [combos, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        comboItems: {
          include: {
            product: true,
          },
        },
      },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-indigo-700">
            Gói Combo
          </h2>
          <p className="text-muted-foreground">
            Quản lý các Gói Combo bán gộp đồ chơi.
          </p>
        </div>
        <Link
          href="/admin/combos/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo Gói Combo
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-indigo-100 shadow-sm">
        <div className="p-4 border-b border-indigo-50 flex items-center gap-4">
          <form className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Tìm kiếm Gói Combo..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-indigo-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-50/50 text-indigo-800 font-semibold border-b border-indigo-100">
              <tr>
                <th className="px-4 py-3">Tên Gói Combo</th>
                <th className="px-4 py-3">Thành phần</th>
                <th className="px-4 py-3 text-right">Tổng giá rời</th>
                <th className="px-4 py-3 text-right">Giá bán Combo</th>
                <th className="px-4 py-3 text-right">Tiết kiệm</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {combos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-8 h-8 text-indigo-200" />
                      <span>Chưa có Gói Combo nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                combos.map((combo) => {
                  const retailPrice = combo.comboItems.reduce(
                    (acc, cur) => acc + Number(cur.product?.price || 0) * cur.quantity,
                    0,
                  );
                  const currentPrice = Number(combo.price);
                  const savings = retailPrice - currentPrice;
                  const discountPercent =
                    retailPrice > 0
                      ? Math.round((savings / retailPrice) * 100)
                      : 0;

                  return (
                    <tr
                      key={combo.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-indigo-50/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-indigo-700 line-clamp-2">
                            {combo.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-neutral-600 space-y-1">
                          {combo.comboItems.length > 0 ? (
                            combo.comboItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1"
                              >
                                <span className="font-medium text-neutral-800">
                                  x{item.quantity}
                                </span>
                                <span
                                  className="truncate max-w-[150px] inline-block"
                                  title={item.product?.title || ""}
                                >
                                  {item.product?.title || "Sản phẩm"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-neutral-400 italic">
                              Chưa có sản phẩm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-500 line-through">
                        {retailPrice > 0 ? formatPrice(retailPrice) : "-"}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-red-600">
                        {formatPrice(currentPrice)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {savings > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-600">
                              -{formatPrice(savings)}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded-sm">
                              {discountPercent}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs">
                            Không có
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/combos/${combo.id}`}
                            className="p-1.5 text-indigo-400 hover:text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
                            title="Sửa Combo"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <form
                            action={async () => {
                              "use server";
                              await deleteProduct(combo.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} trên{" "}
              {totalCount}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i + 1}
                  href={`/admin/combos?${new URLSearchParams({ ...(query && { q: query }), page: (i + 1).toString() }).toString()}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                    currentPage === i + 1
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
