 
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, RefreshCw, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export interface Variant {
  id?: string;
  attributes: Record<string, string>;
  price: number;
  originalPrice?: number | null;
  inventoryCount: number;
  sku?: string;
  imageUrl?: string;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  basePrice: number;
}

export function VariantManager({ variants, onChange, basePrice }: VariantManagerProps) {
  // Option Types (e.g. "Color", "Size") and their possible values
  const [optionGroups, setOptionGroups] = useState<{ name: string; rawValues: string }[]>(() => {
    if (variants.length > 0) {
      const groups: Record<string, Set<string>> = {};
      variants.forEach((v) => {
        Object.entries(v.attributes).forEach(([k, val]) => {
          if (!groups[k]) groups[k] = new Set();
          groups[k].add(val as string);
        });
      });
      return Object.entries(groups).map(([name, set]) => ({
        name,
        rawValues: Array.from(set).join(", "),
      }));
    }
    return [];
  });

  const generateVariants = () => {
    if (optionGroups.length === 0) {
      onChange([]);
      return;
    }

    // Filter out empty groups
    const parsedGroups = optionGroups.map(g => ({
      name: g.name,
      values: g.rawValues.split(",").map(v => v.trim()).filter(Boolean)
    }));
    const validGroups = parsedGroups.filter(g => g.name.trim() !== "" && g.values.length > 0);
    if (validGroups.length === 0) return;

    // Cartesian product
    const cartesian = (arrays: Record<string, string>[][]): Record<string, string>[] => {
      return arrays.reduce<Record<string, string>[]>((a, b) => 
        a.flatMap(d => b.map(e => ({ ...d, ...e })))
      , [{}]);
    };

    const groupValues = validGroups.map(g => g.values.map(v => ({ [g.name]: v })));
    let combinations = groupValues[0];
    if (groupValues.length > 1) {
      combinations = cartesian(groupValues);
    }
    if (combinations.length > 100) {
      window.alert("Số lượng biến thể quá lớn (vượt quá 100). Vui lòng giảm bớt số lượng tùy chọn.");
      return;
    }

    const newVariants: Variant[] = combinations.map(comb => {
      const attrs = comb as Record<string, string>;
      
      // Try to find existing variant to keep its data
      const existing = variants.find(v => {
        return Object.keys(attrs).every(k => v.attributes[k] === attrs[k]) &&
               Object.keys(v.attributes).length === Object.keys(attrs).length;
      });

      if (existing) return existing;

      return {
        attributes: attrs,
        price: basePrice,
        originalPrice: null,
        inventoryCount: 0,
        sku: "",
        imageUrl: ""
      };
    });

    onChange(newVariants);
  };

  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { name: "", rawValues: "" }]);
  };

  const removeOptionGroup = (index: number) => {
    const newGroups = [...optionGroups];
    newGroups.splice(index, 1);
    setOptionGroups(newGroups);
  };

  const updateOptionName = (index: number, name: string) => {
    const newGroups = [...optionGroups];
    newGroups[index].name = name;
    setOptionGroups(newGroups);
  };

  const updateOptionValues = (index: number, valuesStr: string) => {
    const newGroups = [...optionGroups];
    newGroups[index].rawValues = valuesStr;
    setOptionGroups(newGroups);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const removeVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    onChange(newVariants);
  };

  const handleVariantImageUpload = async (index: number, file: File) => {
    const data = new FormData();
    data.append("file", file);
    toast.loading("Đang tải ảnh lên...", { id: `upload-var-${index}` });
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        updateVariant(index, "imageUrl", result.url);
        toast.success("Tải ảnh thành công", { id: `upload-var-${index}` });
      } else {
        toast.error(result.error || "Lỗi tải ảnh", {
          id: `upload-var-${index}`,
        });
      }
    } catch (err) {
      toast.error("Lỗi kết nối", { id: `upload-var-${index}` });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label className="text-base font-bold text-neutral-900">Phân loại sản phẩm (tùy chọn)</Label>
        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addOptionGroup}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhóm phân loại
        </Button>
      </div>
      <p className="text-sm leading-6 text-neutral-500">Thêm các lựa chọn như màu sắc, kích cỡ hoặc phiên bản để thiết lập giá và tồn kho riêng.</p>

      {optionGroups.length > 0 && (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
          {optionGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-1 flex flex-col justify-end gap-2">
                <Label>Tên phân loại</Label>
                <Input 
                  placeholder="VD: Màu sắc" 
                  value={group.name} 
                  onChange={(e) => updateOptionName(idx, e.target.value)}
                />
              </div>
              <div className="flex-[2] flex flex-col justify-end gap-2">
                <Label>Giá trị (cách nhau bằng dấu phẩy)</Label>
                <div className="flex min-w-0 items-center gap-2">
                  <Input 
                    placeholder="VD: Đỏ, Xanh, Vàng" 
                    value={group.rawValues}
                    onChange={(e) => updateOptionValues(idx, e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOptionGroup(idx)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" className="w-full mt-2 border border-neutral-300" onClick={generateVariants}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tạo danh sách phân loại
          </Button>
        </div>
      )}

      {variants.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {variants.map((v, idx) => (
            <article key={idx} className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <p className="min-w-0 truncate text-sm font-bold text-indigo-700">
                  {Object.values(v.attributes).join(" · ")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Xóa phân loại"
                  onClick={() => removeVariant(idx)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Giá gốc (VNĐ)</Label>
                  <Input
                    type="number"
                    value={v.originalPrice || ""}
                    onChange={(e) => updateVariant(idx, "originalPrice", e.target.value ? Number(e.target.value) : null)}
                    placeholder="Không"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Giá bán (VNĐ)</Label>
                  <Input
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tồn kho</Label>
                  <Input
                    type="number"
                    value={v.inventoryCount}
                    onChange={(e) => updateVariant(idx, "inventoryCount", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mã SKU</Label>
                  <Input
                    value={v.sku || ""}
                    onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                    placeholder="SKU-001"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-lg bg-neutral-50 p-2">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border bg-white">
                  {v.imageUrl ? (
                    <Image src={v.imageUrl} alt="Ảnh phân loại" fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-300">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <label className="relative flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary">
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleVariantImageUpload(idx, e.target.files[0]);
                      }
                    }}
                  />
                  Chọn ảnh
                </label>
              </div>
            </article>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm md:block">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Tên Phân Loại</th>
                <th className="px-4 py-3 font-semibold min-w-[120px]">Giá Gốc (VNĐ)</th>
                <th className="px-4 py-3 font-semibold min-w-[120px]">Giá Bán (VNĐ)</th>
                <th className="px-4 py-3 font-semibold min-w-[100px]">Tồn kho</th>
                <th className="px-4 py-3 font-semibold min-w-[120px]">Mã SKU</th>
                <th className="px-4 py-3 font-semibold min-w-[180px]">Hình ảnh</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={idx} className="border-t hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-indigo-700 whitespace-nowrap">
                    {Object.values(v.attributes).join(" - ")}
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={v.originalPrice || ""} 
                      onChange={(e) => updateVariant(idx, "originalPrice", e.target.value ? Number(e.target.value) : null)} 
                      className="h-8"
                      placeholder="Không"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={v.price} 
                      onChange={(e) => updateVariant(idx, "price", Number(e.target.value))} 
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={v.inventoryCount} 
                      onChange={(e) => updateVariant(idx, "inventoryCount", Number(e.target.value))} 
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      value={v.sku || ""} 
                      onChange={(e) => updateVariant(idx, "sku", e.target.value)} 
                      placeholder="SKU-001"
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded border bg-white overflow-hidden shrink-0">
                        {v.imageUrl ? (
                          <Image src={v.imageUrl} alt="Variant" fill className="object-cover" sizes="32px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleVariantImageUpload(idx, e.target.files[0]);
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs">
                          Tải ảnh
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(idx)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
