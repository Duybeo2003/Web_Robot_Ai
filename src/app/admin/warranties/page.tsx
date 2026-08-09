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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">
          Quản lý Bảo hành
        </h1>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày kích hoạt</TableHead>
              <TableHead>Ngày hết hạn</TableHead>
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
                  <TableCell className="font-mono text-xs font-medium text-blue-600">
                    {warranty.serialNumber}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate font-medium text-sm" title={warranty.product.title}>
                      {warranty.product.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{warranty.user.name}</p>
                    <p className="text-xs text-neutral-500">
                      {warranty.user.phoneNumber || warranty.user.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {format(new Date(warranty.startDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {format(new Date(warranty.endDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{getStatusBadge(warranty.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
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
