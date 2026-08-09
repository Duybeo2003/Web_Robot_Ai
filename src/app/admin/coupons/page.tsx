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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Khuyến mãi & Mã giảm giá
          </h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các chiến dịch mã giảm giá.
          </p>
        </div>

        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-[#FF5722] hover:bg-[#E64A19] text-white shadow">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khuyến mãi
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Mã giảm giá mới</DialogTitle>
            </DialogHeader>
            <CouponForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã (Code)</TableHead>
              <TableHead>Mức giảm</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead>Tối đa</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead>Trạng thái</TableHead>
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
                    <TableCell className="font-bold font-mono">
                      {coupon.code}
                    </TableCell>
                    <TableCell className="text-[#E30019] font-bold">
                      {coupon.discountPercent}%
                    </TableCell>
                    <TableCell>{coupon.usageCount}</TableCell>
                    <TableCell>{coupon.usageLimit || "∞"}</TableCell>
                    <TableCell>
                      {coupon.expiresAt
                        ? format(new Date(coupon.expiresAt), "dd/MM/yyyy HH:mm")
                        : "Không thời hạn"}
                    </TableCell>
                    <TableCell>
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
