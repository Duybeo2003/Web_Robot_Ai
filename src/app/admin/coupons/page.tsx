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
import { CouponActions } from "./components/coupon-actions";
import { CouponForm } from "./components/coupon-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";



export default async function AdminCouponsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = props.searchParams;
  const itemsPerPage = 20;
  const currentPage = Number((await searchParams)?.page) || 1;

  const totalCount = await prisma.coupon.count();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const coupons = await prisma.coupon.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Khuyến mãi và mã giảm giá
          </h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các chiến dịch mã giảm giá.
          </p>
        </div>

        <Dialog>
          <DialogTrigger className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khuyến mãi
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm mã giảm giá mới</DialogTitle>
            </DialogHeader>
            <CouponForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã giảm giá</TableHead>
              <TableHead className="hidden md:table-cell">Mức giảm</TableHead>
              <TableHead className="hidden md:table-cell">Đã dùng</TableHead>
              <TableHead className="hidden md:table-cell">Tối đa</TableHead>
              <TableHead className="hidden lg:table-cell">Hết hạn</TableHead>
              <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Không có mã giảm giá nào.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => {
                const isExpired =
                  coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const isMaxedOut =
                  coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
                const isActive = !isExpired && !isMaxedOut;

                return (
                  <TableRow key={coupon.id}>
                    <TableCell className="min-w-0 font-bold font-mono">
                      <span className="block truncate">{coupon.code}</span>
                      <span className="mt-1 block font-sans text-sm font-bold text-primary md:hidden">
                        Giảm {coupon.discountPercent}%
                      </span>
                      <span className="mt-1 block font-sans text-xs font-normal text-muted-foreground md:hidden">
                        Đã dùng {coupon.usageCount}/{coupon.usageLimit || "∞"}
                      </span>
                      <span className="mt-2 inline-flex sm:hidden">
                        <Badge variant={isActive ? "default" : "destructive"}>
                          {isActive ? "Đang mở" : isExpired ? "Hết hạn" : "Hết lượt"}
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-primary font-bold md:table-cell">
                      {coupon.discountPercent}%
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{coupon.usageCount}</TableCell>
                    <TableCell className="hidden md:table-cell">{coupon.usageLimit || "∞"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {coupon.expiresAt
                        ? format(new Date(coupon.expiresAt), "dd/MM/yyyy HH:mm")
                        : "Không thời hạn"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={isActive ? "default" : "destructive"}>
                        {isActive
                          ? "Đang mở"
                          : isExpired
                            ? "Hết hạn"
                            : "Hết lượt"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <CouponActions
                        coupon={{ ...coupon, usageLimit: coupon.usageLimit, discountPercent: coupon.discountPercent ?? 0 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
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
