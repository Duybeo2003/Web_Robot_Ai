import { PrismaClient } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ReviewActions } from "./components/review-actions"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      product: true,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Đánh giá khách hàng</h2>
        <p className="text-muted-foreground">Kiểm duyệt và quản lý các đánh giá về sản phẩm.</p>
      </div>
      
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Không có đánh giá nào.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.user?.name || "Người dùng ẩn danh"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/shop/${review.product?.slug}`} target="_blank" className="flex items-center gap-2 hover:underline">
                      {review.product?.imageUrl && (
                        <div className="w-8 h-8 relative rounded overflow-hidden border">
                          <Image src={review.product.imageUrl} alt={review.product.title} fill className="object-cover" />
                        </div>
                      )}
                      <span className="line-clamp-1 max-w-[150px]" title={review.product?.title}>
                        {review.product?.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-bold mr-1">{review.rating}</span>
                      <Star className="w-4 h-4 fill-[#FACC15] text-[#FACC15]" />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="line-clamp-2 text-sm" title={review.comment || ""}>
                      {review.comment || <span className="text-muted-foreground italic">Không có bình luận</span>}
                    </p>
                  </TableCell>
                  <TableCell>{format(new Date(review.createdAt), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <ReviewActions reviewId={review.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
