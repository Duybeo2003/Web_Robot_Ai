"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { createReturnRequest } from "@/actions/rma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function RmaButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);

  const handleSubmit = async () => {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 10) {
      setError("Lý do đổi trả quá ngắn.");
      return;
    }
    if (evidence && evidence.size > 5 * 1024 * 1024) {
      setError("Ảnh minh chứng không được vượt quá 5 MB.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let imageUrl: string | undefined;
      if (evidence) {
        const upload = new FormData();
        upload.set("file", evidence);
        upload.set("orderId", orderId);
        const response = await fetch("/api/uploads/rma", { method: "POST", body: upload });
        const result = (await response.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!response.ok || !result.url) {
          setError(result.error || "Không thể tải ảnh minh chứng.");
          return;
        }
        imageUrl = result.url;
      }
      const res = await createReturnRequest({
        orderId,
        reason: normalizedReason,
        imageUrl,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      setOpen(false);
      setReason("");
      setEvidence(null);
      toast.success("Đã gửi yêu cầu đổi trả. RoboEQ sẽ liên hệ sớm.");
    } catch {
      setError("Không thể gửi yêu cầu lúc này. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-white"
          />
        }
      >
        Yêu cầu Đổi/Trả
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            Yêu cầu Đổi/Trả hàng
          </DialogTitle>
          <DialogDescription>
            Vui lòng nhập lý do bạn muốn đổi/trả đơn hàng này. Nếu có sản phẩm
            lỗi, hãy mô tả chi tiết.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <Textarea
            placeholder="Lý do (ít nhất 10 ký tự)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="space-y-2">
            <Label htmlFor={`rma-evidence-${orderId}`}>Ảnh minh chứng (không bắt buộc)</Label>
            <Input
              id={`rma-evidence-${orderId}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setEvidence(event.target.files?.[0] || null)}
            />
            <p className="text-xs text-neutral-500">JPEG, PNG hoặc WebP; tối đa 5 MB.</p>
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Gửi Yêu Cầu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
