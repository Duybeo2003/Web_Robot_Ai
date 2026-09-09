"use client";

import { useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/actions/review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ReviewItem = {
  productId: string;
  product: { title: string };
};

export function ReviewButton({
  orderId,
  items,
}: {
  orderId: string;
  items: ReviewItem[];
}) {
  const products = useMemo(
    () =>
      Array.from(
        new Map(items.map((item) => [item.productId, item.product.title])).entries(),
        ([id, title]) => ({ id, title }),
      ),
    [items],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!productId) {
      toast.error("Vui lòng chọn sản phẩm cần đánh giá.");
      return;
    }
    if (comment.trim().length < 5) {
      toast.error("Nhận xét cần có ít nhất 5 ký tự.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("comment", comment.trim());
    const result = await submitReview(productId, formData);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Không thể gửi đánh giá.");
      return;
    }

    toast.success("Cảm ơn bạn đã đánh giá sản phẩm.");
    setComment("");
    setRating(5);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2 rounded-lg border-[#FF5722] px-4 py-2 text-sm font-medium text-[#FF5722] hover:bg-orange-50"
      >
        <Star className="size-4" aria-hidden="true" />
        Đánh giá
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đánh giá sản phẩm</DialogTitle>
            <DialogDescription>
              Đánh giá được gắn với giao dịch đã hoàn tất và sẽ hiển thị sau khi qua kiểm duyệt.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="grid gap-2 text-sm font-medium" htmlFor={`review-product-${orderId}`}>
              Sản phẩm
              <select
                id={`review-product-${orderId}`}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                disabled={loading}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.title}</option>
                ))}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Mức hài lòng</legend>
              <div className="flex justify-center gap-2" aria-label={`${rating} trên 5 sao`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    onClick={() => setRating(star)}
                    aria-label={`${star} sao`}
                    disabled={loading}
                  >
                    <Star
                      className={`size-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="grid gap-2 text-sm font-medium" htmlFor={`review-comment-${orderId}`}>
              Nhận xét của bạn
              <Textarea
                id={`review-comment-${orderId}`}
                placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                minLength={5}
                maxLength={2_000}
                rows={4}
                disabled={loading}
              />
            </label>

            <Button
              onClick={handleSubmit}
              disabled={loading || !productId}
              className="w-full bg-orange-500 text-white hover:bg-orange-600"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
              Gửi đánh giá
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
