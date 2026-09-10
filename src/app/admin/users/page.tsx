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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { UserActions } from "./components/user-actions";



export default async function AdminUsersPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = props.searchParams;
  const itemsPerPage = 20;
  const currentPage = Number((await searchParams)?.page) || 1;

  const totalCount = await prisma.user.count({
    where: {
      role: "USER",
      deletedAt: null,
    },
  });
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const users = await prisma.user.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    where: {
      role: "USER",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Người dùng</h2>
        <p className="text-muted-foreground">
          Quản lý tài khoản khách hàng và phân quyền.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Table className="table-fixed md:table-auto">
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead className="hidden md:table-cell">Số điện thoại</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tham gia</TableHead>
              <TableHead className="hidden sm:table-cell">Số đơn hàng</TableHead>
              <TableHead className="hidden xl:table-cell">Vai trò</TableHead>
              <TableHead className="w-20 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  Không có người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="min-w-0 whitespace-normal font-medium">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block truncate">{user.name || "Khách hàng"}</span>
                        <span className="mt-1 block truncate text-xs font-normal text-muted-foreground md:hidden">
                          {user.phoneNumber || "Chưa cập nhật số điện thoại"}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground lg:hidden">
                          Tham gia {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-normal sm:hidden">
                          <span>{user._count.orders} đơn hàng</span>
                          <Badge variant="secondary">Khách hàng</Badge>
                        </span>
                      </div>
                      <div className="shrink-0 md:hidden">
                        <UserActions userId={user.id} currentRole={user.role} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.phoneNumber || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(user.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{user._count.orders}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
              Khách hàng
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden w-20 text-right md:table-cell">
                    <UserActions userId={user.id} currentRole={user.role} />
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
