"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AffiliateLinkGenerator({ 
  userId, 
  products 
}: { 
  userId: string;
  products: { id: string; title: string; slug: string; commissionRate: number | null }[];
}) {
  const [selectedProductSlug, setSelectedProductSlug] = useState(products[0]?.slug || "");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // delay to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const generatedLink = selectedProductSlug 
    ? `${origin}/shop/${selectedProductSlug}?ref=${userId}`
    : `${origin}?ref=${userId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-neutral-700">Chọn sản phẩm giới thiệu:</label>
        <select
          value={selectedProductSlug}
          onChange={(e) => setSelectedProductSlug(e.target.value)}
          className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[#FF5722]"
        >
          <option value="">Trang chủ (toàn cửa hàng)</option>
          {products.map(p => (
            <option key={p.id} value={p.slug}>
              {p.title} (Hoa hồng: {p.commissionRate || 10}%)
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input 
          type="text" 
          readOnly 
          value={generatedLink}
          aria-label="Liên kết giới thiệu"
          className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600 outline-none"
        />
        <Button onClick={handleCopy} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Đã chép" : "Sao chép"}
        </Button>
      </div>
    </div>
  );
}
