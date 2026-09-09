import { prisma } from "@/lib/prisma";
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
import { RmaActionDropdown } from "./components/rma-action-dropdown";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// import Image from "next/image";

export default async function AdminReturnsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const itemsPerPage = 20;
  const requestedPage = Number.parseInt(searchParams.page || "1", 10);
  const totalCount = await prisma.returnRequest.count();
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const currentPage = Math.min(
    totalPages,
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  );

  const returns = await prisma.returnRequest.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    select: {
      id: true,
      orderId: true,
      reason: true,
      imageUrl: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, phoneNumber: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-600 border-yellow-200"
          >
            Chờ duyệt
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-600 border-blue-200"
          >
            Đã tiếp nhận
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 border-green-200"
          >
            Hoàn thành
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-200"
          >
            Từ chối
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
          Yêu cầu đổi/trả (RMA)
        </h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Yêu cầu đổi/trả</TableHead>
              <TableHead className="hidden md:table-cell">Khách hàng</TableHead>
              <TableHead className="hidden lg:table-cell">Mã đơn hàng</TableHead>
              <TableHead className="hidden md:table-cell">Lý do</TableHead>
              <TableHead className="hidden xl:table-cell">Minh chứng</TableHead>
              <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày gửi</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-neutral-500"
                >
                  Chưa có yêu cầu đổi/trả nào
                </TableCell>
              </TableRow>
            ) : (
              returns.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="min-w-0 font-mono text-xs">
                    <span>{req.id.slice(0, 8)}...</span>
                    <div className="mt-2 space-y-1 font-sans md:hidden">
                      <p className="truncate text-sm font-semibold">{req.user.name || "Khách hàng"}</p>
                      <p className="truncate text-xs text-neutral-500">{req.user.phoneNumber || req.user.email}</p>
                      <p className="line-clamp-2 text-sm text-neutral-700">{req.reason}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                      {getStatusBadge(req.status)}
                      {req.imageUrl && <a href={req.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-700 hover:underline">Xem ảnh</a>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium">{req.user.name}</p>
                    <p className="text-xs text-neutral-500">
                      {req.user.phoneNumber || req.user.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-blue-600 font-medium lg:table-cell">
                    {req.orderId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div
                      className="max-w-[200px] truncate text-sm"
                      title={req.reason}
                    >
                      {req.reason}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {req.imageUrl ? (
                      <a
                        href={req.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        Xem ảnh
                      </a>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="hidden text-sm text-neutral-500 lg:table-cell">
                    {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <RmaActionDropdown
                      requestId={req.id}
                      currentStatus={req.status}
                    />
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
