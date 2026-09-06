"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Assume an action to submit review exists or we mock it
// import { submitReview } from "@/actions/review";

export function ReviewButton({ orderId: _orderId, items: _items }: { orderId: string, items: unknown[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // await submitReview(_orderId, rating, comment);
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));
      toast.success("Cảm ơn bạn đã đánh giá!");
      setIsOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="px-4 py-2 text-sm font-medium border-[#FF5722] text-[#FF5722] hover:bg-orange-50 rounded-sm flex items-center gap-2"
      >
        <Star className="w-4 h-4" />
        Đánh giá
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đánh giá Đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nhận xét của bạn</label>
              <Textarea 
                placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Gửi Đánh Giá
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
