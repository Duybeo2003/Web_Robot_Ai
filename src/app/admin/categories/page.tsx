export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CategoryActions } from "./components/category-actions";
import { CreateCategoryDialog } from "./components/create-category-dialog";



export default async function AdminCategoriesPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = props.searchParams;
  const itemsPerPage = 20;
  const currentPage = Number((await searchParams)?.page) || 1;

  const totalCount = await prisma.category.count();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const categories = await prisma.category.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Danh mục sản phẩm
          </h2>
          <p className="text-muted-foreground">
            Quản lý và phân loại nhóm sản phẩm.
          </p>
        </div>

        <CreateCategoryDialog />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Table className="table-fixed sm:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Tên danh mục</TableHead>
              <TableHead className="hidden sm:table-cell">Mô tả</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tạo</TableHead>
              <TableHead className="hidden md:table-cell">Số sản phẩm</TableHead>
              <TableHead className="w-16 px-2 text-right sm:w-auto sm:px-4">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Không có danh mục nào.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="min-w-0 whitespace-normal font-medium">
                    <span className="block truncate">{category.name}</span>
                    <span className="mt-1 block max-w-52 truncate text-xs font-normal text-muted-foreground sm:hidden">
                      {category.description || "Chưa có mô tả"}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground md:hidden">
                      {category._count.products} sản phẩm
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-muted-foreground sm:table-cell">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(category.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{category._count.products}</TableCell>
                  <TableCell className="w-16 px-2 text-right sm:w-auto sm:px-4">
                    <CategoryActions category={category} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages} (Tổng: {totalCount})
            </p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link href={`?page=${currentPage - 1}`}>
                  <Button variant="outline" size="sm">← Trước</Button>
                </Link>
              )}
              {currentPage < totalPages && (
                <Link href={`?page=${currentPage + 1}`}>
                  <Button variant="outline" size="sm">Sau →</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
