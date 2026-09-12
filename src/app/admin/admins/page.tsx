export const dynamic = "force-dynamic";
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
import { UserActions } from "../users/components/user-actions";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { AddAdminModal } from "./components/add-admin-modal";



export default async function AdminManagementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "STORE_MANAGER", "EDITOR"],
      },
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản trị viên</h2>
          <p className="text-muted-foreground">
            Quản lý các tài khoản có quyền quản trị hệ thống.
          </p>
        </div>
        <AddAdminModal />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Table className="table-fixed md:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Tài khoản</TableHead>
              <TableHead className="hidden md:table-cell">Số điện thoại</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tham gia</TableHead>
              <TableHead className="hidden sm:table-cell">Vai trò</TableHead>
              <TableHead className="w-20 text-right">Thao tác</TableHead>
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
                  <TableCell className="min-w-0 font-medium">
                    <span className="block truncate">{user.name || "Quản trị viên"}</span>
                    <span className="mt-1 block max-w-52 truncate text-xs font-normal text-muted-foreground md:hidden">
                      {user.phoneNumber || user.email || "Chưa cập nhật liên hệ"}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground lg:hidden">
                      Tham gia {format(new Date(user.createdAt), "dd/MM/yyyy")}
                    </span>
                    <span className="mt-2 inline-flex sm:hidden">
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role === "STORE_MANAGER"
                          ? "Quản lý cửa hàng"
                          : user.role === "EDITOR"
                            ? "Biên tập viên"
                            : "Quản trị viên"}
                      </Badge>
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.phoneNumber || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(user.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role === "STORE_MANAGER"
                        ? "Quản lý cửa hàng"
                        : user.role === "EDITOR"
                          ? "Biên tập viên"
                          : "Quản trị viên"}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-20 text-right">
                    <UserActions userId={user.id} currentRole={user.role} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
