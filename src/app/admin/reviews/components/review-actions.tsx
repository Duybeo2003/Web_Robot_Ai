"use client";

import { Check, Clock3, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteReview, updateReviewStatus } from "@/actions/admin";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export function ReviewActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStatus = async (nextStatus: ReviewStatus) => {
    setIsLoading(true);
    const result = await updateReviewStatus(reviewId, nextStatus);
    setIsLoading(false);
    if (!result.success) {
      toast.error(result.error || "Không thể cập nhật đánh giá.");
      return;
    }
    toast.success("Đã cập nhật trạng thái đánh giá.");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa vĩnh viễn đánh giá này?")) return;
    setIsLoading(true);
    const result = await deleteReview(reviewId);
    setIsLoading(false);
    if (!result.success) {
      toast.error(result.error || "Không thể xóa đánh giá.");
      return;
    }
    toast.success("Đã xóa đánh giá.");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {status !== "APPROVED" && (
        <button
          type="button"
          onClick={() => handleStatus("APPROVED")}
          disabled={isLoading}
          className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
          title="Duyệt đánh giá"
          aria-label="Duyệt đánh giá"
        >
          <Check className="size-4" />
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          type="button"
          onClick={() => handleStatus("REJECTED")}
          disabled={isLoading}
          className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
          title="Từ chối đánh giá"
          aria-label="Từ chối đánh giá"
        >
          <X className="size-4" />
        </button>
      )}
      {status !== "PENDING" && (
        <button
          type="button"
          onClick={() => handleStatus("PENDING")}
          disabled={isLoading}
          className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          title="Đưa về chờ duyệt"
          aria-label="Đưa về chờ duyệt"
        >
          <Clock3 className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        title="Xóa đánh giá"
        aria-label="Xóa đánh giá"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
