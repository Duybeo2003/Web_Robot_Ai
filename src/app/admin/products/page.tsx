import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Edit, Trash2, Search, Package } from "lucide-react"
import { deleteProduct } from "@/actions/product"
import Image from "next/image"

export const metadata = {
  title: "Quản lý sản phẩm - Admin",
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string, page?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const itemsPerPage = 10;

  const whereClause = query ? { title: { contains: query } } : {};

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
      include: { category: true }
    }),
    prisma.product.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sản phẩm</h2>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm trong cửa hàng.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-[#FF5722] text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-[#E64A19] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm sản phẩm
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex items-center gap-4">
          <form className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Giá bán</th>
                <th className="px-4 py-3">Kho</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-gray-300" />
                      <span>Không tìm thấy sản phẩm nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 shrink-0 overflow-hidden">
                          {product.imageUrl ? (
                            <div className="relative w-full h-full">
                              <Image src={product.imageUrl} alt={product.title} fill className="object-cover" sizes="40px" />
                            </div>
                          ) : (
                            <Package className="w-5 h-5 m-2.5 text-gray-400" />
                          )}
                        </div>
                        <div className="font-medium text-gray-900 line-clamp-2">{product.title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {product.category?.name || (
                          product.type === 'ROBOT_STEM' ? 'Robot STEM' : 
                          product.type === 'KIT_ARDUINO' ? 'Kit Arduino' : 
                          product.type === 'DO_CHOI_LOGIC' ? 'Đồ chơi Logic' : product.type
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatPrice(Number(product.price))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.inventoryCount > 10 ? 'bg-green-50 text-green-700' : 
                        product.inventoryCount > 0 ? 'bg-yellow-50 text-yellow-700' : 
                        'bg-red-50 text-red-700'
                      }`}>
                        {product.inventoryCount} chiếc
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form action={async () => { "use server"; await deleteProduct(product.id); }}>
                          <button type="submit" className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} trên {totalCount}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i + 1}
                  href={`/admin/products?${new URLSearchParams({ ...(query && {q: query}), page: (i + 1).toString() }).toString()}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                    currentPage === i + 1 
                      ? 'bg-[#FF5722] text-white' 
                      : 'hover:bg-gray-100 text-gray-600'
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
  )
}
