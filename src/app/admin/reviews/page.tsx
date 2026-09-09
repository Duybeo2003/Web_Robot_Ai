import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ReviewActions } from "./components/review-actions";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";



export default async function AdminReviewsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const itemsPerPage = 20;
  const requestedPage = Math.max(1, Number(searchParams?.page) || 1);

  const totalCount = await prisma.review.count();
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const currentPage = Math.min(requestedPage, totalPages);

  const reviews = await prisma.review.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      status: true,
      createdAt: true,
      user: { select: { name: true } },
      product: { select: { slug: true, imageUrl: true, title: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Đánh giá khách hàng
        </h2>
        <p className="text-muted-foreground">
          Kiểm duyệt và quản lý các đánh giá về sản phẩm.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead className="hidden md:table-cell">Sản phẩm</TableHead>
              <TableHead className="hidden sm:table-cell">Đánh giá</TableHead>
              <TableHead className="hidden lg:table-cell">Nội dung</TableHead>
              <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
              <TableHead className="hidden xl:table-cell">Ngày đăng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Không có đánh giá nào.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="min-w-0 font-medium">
                    <span className="block truncate">{review.user?.name || "Người dùng ẩn danh"}</span>
                    <span className="mt-1 block line-clamp-2 text-sm font-normal text-neutral-700 md:hidden">
                      {review.product?.title || "Sản phẩm không còn tồn tại"}
                    </span>
                    <span className="mt-1 flex items-center gap-1 sm:hidden">
                      <strong>{review.rating}</strong>
                      <Star className="h-4 w-4 fill-[#FACC15] text-[#FACC15]" />
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs font-normal text-muted-foreground lg:hidden">
                      {review.comment || "Không có bình luận"}
                    </span>
                    <span className="mt-2 inline-flex md:hidden">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${review.status === "APPROVED" ? "bg-green-100 text-green-700" : review.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {{ APPROVED: "Đã duyệt", REJECTED: "Từ chối", PENDING: "Chờ duyệt" }[review.status]}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link
                      href={`/shop/${review.product?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline"
                    >
                      {review.product?.imageUrl && (
                        <div className="w-8 h-8 relative rounded overflow-hidden border">
                          <Image
                            src={review.product.imageUrl}
                            alt={review.product.title}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span
                        className="line-clamp-1 max-w-[150px]"
                        title={review.product?.title}
                      >
                        {review.product?.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center">
                      <span className="font-bold mr-1">{review.rating}</span>
                      <Star className="w-4 h-4 fill-[#FACC15] text-[#FACC15]" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[300px] lg:table-cell">
                    <p
                      className="line-clamp-2 text-sm"
                      title={review.comment || ""}
                    >
                      {review.comment || (
                        <span className="text-muted-foreground italic">
                          Không có bình luận
                        </span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        review.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : review.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {{ APPROVED: "Đã duyệt", REJECTED: "Từ chối", PENDING: "Chờ duyệt" }[review.status]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {format(new Date(review.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReviewActions reviewId={review.id} status={review.status} />
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
