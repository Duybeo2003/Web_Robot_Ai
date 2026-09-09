import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminWarrantiesPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  const itemsPerPage = 20;
  const currentPage = Number(searchParams?.page) || 1;

  const totalCount = await prisma.warranty.count();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const warranties = await prisma.warranty.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    include: {
      user: { select: { name: true, phoneNumber: true, email: true } },
      product: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 border-green-200"
          >
            Đang hiệu lực
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge
            variant="outline"
            className="bg-neutral-50 text-neutral-600 border-neutral-200"
          >
            Hết hạn
          </Badge>
        );
      case "VOID":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-200"
          >
            Bị vô hiệu
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">
          Quản lý bảo hành
        </h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Số sê-ri</TableHead>
              <TableHead className="hidden md:table-cell">Sản phẩm</TableHead>
              <TableHead className="hidden lg:table-cell">Khách hàng</TableHead>
              <TableHead className="hidden xl:table-cell">Ngày kích hoạt</TableHead>
              <TableHead className="hidden xl:table-cell">Ngày hết hạn</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warranties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-neutral-500"
                >
                  Chưa có dữ liệu bảo hành
                </TableCell>
              </TableRow>
            ) : (
              warranties.map((warranty) => (
                <TableRow key={warranty.id}>
                  <TableCell className="min-w-0 font-mono text-xs font-medium text-blue-600">
                    <span className="block truncate">{warranty.serialNumber}</span>
                    <div className="mt-2 space-y-1 font-sans md:hidden">
                      <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{warranty.product.title}</p>
                      <p className="truncate text-xs text-neutral-500">{warranty.user.name || warranty.user.phoneNumber || warranty.user.email}</p>
                      <p className="text-xs text-neutral-500">
                        {format(new Date(warranty.startDate), "dd/MM/yyyy")} – {format(new Date(warranty.endDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="max-w-[200px] truncate font-medium text-sm" title={warranty.product.title}>
                      {warranty.product.title}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="font-medium text-sm">{warranty.user.name}</p>
                    <p className="text-xs text-neutral-500">
                      {warranty.user.phoneNumber || warranty.user.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-neutral-500 xl:table-cell">
                    {format(new Date(warranty.startDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="hidden text-sm text-neutral-500 xl:table-cell">
                    {format(new Date(warranty.endDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{getStatusBadge(warranty.status)}</TableCell>
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
