"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInventoryTransaction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type InventoryProduct = {
  id: string;
  title: string;
  sku: string | null;
  inventoryCount: number;
  variants: {
    id: string;
    sku: string | null;
    attributes: unknown;
    inventoryCount: number;
  }[];
};

function variantLabel(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return "Phân loại";
  }
  return (
    Object.values(attributes)
      .filter((value): value is string | number =>
        typeof value === "string" || typeof value === "number",
      )
      .join(" - ") || "Phân loại"
  );
}

export function NewPoForm({ products }: { products: InventoryProduct[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    variantId: "",
    type: "IN" as "IN" | "OUT",
    quantity: 1,
    costPrice: "",
    reference: "",
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      setError("Vui lòng chọn sản phẩm");
      return;
    }
    const selectedProduct = products.find(
      (product) => product.id === formData.productId,
    );
    if (selectedProduct?.variants.length && !formData.variantId) {
      setError("Vui lòng chọn phân loại kho");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await createInventoryTransaction({
        ...formData,
        variantId: formData.variantId || undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        reference: formData.reference.trim() || undefined,
        note: formData.note.trim() || undefined,
        quantity: Number(formData.quantity),
      });

      if (res.success) {
        router.push("/admin/inventory");
        router.refresh();
      } else {
        setError(res.error || "Có lỗi xảy ra");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống");
      setLoading(false);
    }
  };

  const selectedProduct = products.find(
    (product) => product.id === formData.productId,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Label>Loại giao dịch</Label>
        <Select
          value={formData.type}
          onValueChange={(val) => setFormData({ ...formData, type: (val as "IN" | "OUT") || "IN" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Nhập kho</SelectItem>
            <SelectItem value="OUT">Xuất kho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Sản phẩm</Label>
        <Select
          value={formData.productId}
          onValueChange={(val) =>
            setFormData({
              ...formData,
              productId: val || "",
              variantId: "",
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title} (Tồn: {p.variants.length
                  ? p.variants.reduce(
                      (total, variant) => total + variant.inventoryCount,
                      0,
                    )
                  : p.inventoryCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && selectedProduct.variants.length > 0 && (
        <div className="space-y-3">
          <Label>Phân loại kho</Label>
          <Select
            value={formData.variantId}
            onValueChange={(value) =>
              setFormData({ ...formData, variantId: value || "" })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn phân loại" />
            </SelectTrigger>
            <SelectContent>
              {selectedProduct.variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variantLabel(variant.attributes)} · Tồn {variant.inventoryCount}
                  {variant.sku ? ` · SKU ${variant.sku}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Label>Số lượng {formData.type === "IN" ? "nhập" : "xuất"}</Label>
          <Input
            type="number"
            min="1"
            max="1000000"
            required
            value={formData.quantity}
            onChange={(e) =>
              setFormData({
                ...formData,
                quantity: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        {formData.type === "IN" && (
          <div className="space-y-3">
            <Label>Giá vốn mỗi đơn vị (không bắt buộc)</Label>
            <Input
              type="number"
              min="0"
              max="1000000000"
              placeholder="Ví dụ: 150000"
              value={formData.costPrice}
              onChange={(e) =>
                setFormData({ ...formData, costPrice: e.target.value })
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Mã tham chiếu (không bắt buộc)</Label>
        <Input
          placeholder="Số phiếu nhập, mã đơn hàng..."
          value={formData.reference}
          onChange={(e) =>
            setFormData({ ...formData, reference: e.target.value })
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Ghi chú</Label>
        <Textarea
          placeholder="Nhập ghi chú cho giao dịch này..."
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Xác nhận {formData.type === "IN" ? "nhập kho" : "xuất kho"}
      </Button>
    </form>
  );
}
