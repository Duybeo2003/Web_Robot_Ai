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
      role: {
        not: "ADMIN",
      },
    },
  });
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const users = await prisma.user.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    where: {
      role: {
        not: "ADMIN",
      },
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

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead>Số đơn hàng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Không có người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "Khách hàng"}
                  </TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{user._count.orders}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions userId={user.id} currentRole={user.role} />
                  </TableCell>
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
