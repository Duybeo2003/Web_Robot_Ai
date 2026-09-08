"use client";

import { useState } from "react";
import { confirmCommissionPayout } from "@/actions/commission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function PayoutControl({ commissionId }: { commissionId: string }) {
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="flex min-w-72 gap-2">
      <Input
        aria-label="Mã đối soát chi hoa hồng"
        placeholder="Mã giao dịch chi trả"
        value={reference}
        minLength={6}
        maxLength={191}
        onChange={(event) => setReference(event.target.value)}
      />
      <Button
        size="sm"
        disabled={pending || reference.trim().length < 6}
        onClick={async () => {
          setPending(true);
          const result = await confirmCommissionPayout(commissionId, reference);
          setPending(false);
          if (result.success) toast.success("Đã ghi nhận chi hoa hồng.");
          else toast.error(result.error);
        }}
      >
        {pending ? "Đang lưu..." : "Xác nhận chi"}
      </Button>
    </div>
  );
}
