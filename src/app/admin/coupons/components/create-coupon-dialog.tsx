"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CouponForm } from "./coupon-form";

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
        <Plus className="mr-2 h-4 w-4" />
        Thêm khuyến mãi
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm mã giảm giá mới</DialogTitle>
        </DialogHeader>
        <CouponForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
