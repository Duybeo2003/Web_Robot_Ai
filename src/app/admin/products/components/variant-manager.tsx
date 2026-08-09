/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, RefreshCw } from "lucide-react";

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

  return (
    <div className="space-y-4 border p-4 rounded-md bg-neutral-50/50">
      <div className="flex justify-between items-center">
        <Label className="text-base font-bold text-neutral-900">Phân loại sản phẩm (Tùy chọn)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOptionGroup}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Nhóm Phân loại
        </Button>
      </div>
      <p className="text-sm text-neutral-500">Thêm các phân loại như Màu sắc, Kích cỡ, Phiên bản... để thiết lập Giá và Kho riêng.</p>

      {optionGroups.length > 0 && (
        <div className="space-y-4 bg-white p-4 border rounded-md shadow-sm">
          {optionGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-1 flex flex-col justify-end gap-2">
                <Label>Tên Phân Loại</Label>
                <Input 
                  placeholder="VD: Màu sắc" 
                  value={group.name} 
                  onChange={(e) => updateOptionName(idx, e.target.value)}
                />
              </div>
              <div className="flex-[2] flex flex-col justify-end gap-2">
                <Label>Giá trị (Cách nhau bằng dấu phẩy)</Label>
                <div className="flex items-center gap-2">
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
            Tạo / Cập nhật Danh sách Biến thể
          </Button>
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-4 border rounded-md overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Tên Phân Loại</th>
                <th className="px-4 py-3 font-semibold min-w-[120px]">Giá Gốc (VNĐ)</th>
                <th className="px-4 py-3 font-semibold min-w-[120px]">Giá Bán (VNĐ)</th>
                <th className="px-4 py-3 font-semibold min-w-[100px]">Tồn kho</th>
                <th className="px-4 py-3 font-semibold min-w-[120px]">Mã SKU</th>
                <th className="px-4 py-3 font-semibold min-w-[150px]">Link Ảnh</th>
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
                    <Input 
                      value={v.imageUrl || ""} 
                      onChange={(e) => updateVariant(idx, "imageUrl", e.target.value)} 
                      placeholder="https://..."
                      className="h-8"
                    />
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
