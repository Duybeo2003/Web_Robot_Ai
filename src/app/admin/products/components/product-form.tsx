/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertProduct } from "@/actions/admin";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

import { VariantManager, Variant } from "./variant-manager";

export function ProductForm({
  initialData,
  categories = [],
  availableProducts = [],
  forceComboMode = false,
}: {
  initialData?: any;
  categories?: any[];
  availableProducts?: any[];
  forceComboMode?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price ? Number(initialData.price) : 0,
    type: initialData?.type || "ROBOT_STEM", // fallback enum
    supplyType: initialData?.supplyType || "IN_HOUSE",
    categoryId: initialData?.categoryId || categories?.[0]?.id || "", // new category link
    inventoryCount: initialData?.inventoryCount || 0,
    sku: initialData?.sku || "",
    imageUrl: initialData?.imageUrl || "",
    originalPrice: initialData?.originalPrice
      ? Number(initialData.originalPrice)
      : 0,
    flashSaleActive: initialData?.flashSaleActive || false,
    flashSaleEndDate: initialData?.flashSaleEndDate
      ? new Date(initialData.flashSaleEndDate as string).toISOString().slice(0, 16)
      : "",
    flashSaleStock: initialData?.flashSaleStock || 0,
    ageRange: initialData?.ageRange || "",
    primarySkill: initialData?.primarySkill || "",
    educationalGoal: initialData?.educationalGoal || "",
    isCombo: forceComboMode ? true : initialData?.isCombo || false,
    comboItems:
      (initialData?.comboItems || [])?.map((ci: any) => ({
        productId: ci.productId,
        quantity: ci.quantity,
        title: ci.product?.title || "Sản phẩm",
        price: ci.product?.price || 0,
        imageUrl: ci.product?.imageUrl || "",
      })) || [],
    variants: (initialData?.variants || [])?.map((v: any) => ({
      id: v.id,
      attributes: v.attributes,
      price: Number(v.price),
      originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
      inventoryCount: v.inventoryCount,
      sku: v.sku || "",
      imageUrl: v.imageUrl || ""
    })) || [],
    externalAffiliateLink: initialData?.externalAffiliateLink || "",
    commissionRate: initialData?.commissionRate ? Number(initialData.commissionRate) : 10,
    depositPercent: initialData?.depositPercent ? Number(initialData.depositPercent) : 70,
    estimatedArrivalDate: initialData?.estimatedArrivalDate
      ? new Date(initialData.estimatedArrivalDate as string).toISOString().slice(0, 16)
      : "",
  });

  const [selectedProductId, setSelectedProductId] = useState("");

  // Sync total retail price as original price for combos
  useEffect(() => {
    if (formData.isCombo) {
      const totalRetail = formData.comboItems.reduce(
        (acc: number, cur: any) => acc + cur.price * cur.quantity,
        0
      );
      if (formData.originalPrice !== totalRetail) {
        setTimeout(() => {
          setFormData((prev) => ({ ...prev, originalPrice: totalRetail }));
        }, 0);
      }
    }
  }, [formData.comboItems, formData.isCombo, formData.originalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await upsertProduct(formData, initialData?.id);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        initialData ? "Cập nhật thành công" : "Thêm mới thành công",
      );
      router.push(forceComboMode ? "/admin/combos" : "/admin/products");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl bg-white p-6 rounded-md border shadow-sm"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="title"
              className="text-base font-bold text-neutral-900"
            >
              1. Tên Sản Phẩm / Tên Gói Combo
            </Label>
          </div>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder={
              formData.isCombo
                ? "Nhập tên hoặc bấm chọn gợi ý bên dưới (ví dụ: Combo Phát triển EQ)"
                : "Nhập tên sản phẩm..."
            }
            required
            className="h-10"
          />
          {formData.isCombo && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-muted-foreground mr-1 mt-1 font-medium">
                Gợi ý nhanh:
              </span>
              {[
                "Combo Phát Triển Tư Duy Logic",
                "Combo Vận Động Tinh Toàn Diện",
                "Combo Nuôi Dưỡng Trí Tuệ Cảm Xúc (EQ)",
                "Combo Học Tiếng Anh Thông Minh",
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100 active:bg-indigo-200"
                  onClick={() => setFormData({ ...formData, title: sug })}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Danh mục</Label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option value="">-- Chưa có danh mục --</option>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplyType">Phân loại Nguồn hàng</Label>
            <select
              id="supplyType"
              value={formData.supplyType}
              onChange={(e) =>
                setFormData({ ...formData, supplyType: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            >
              <option value="IN_HOUSE">Hàng tự sản xuất</option>
              <option value="AFFILIATE_SELL">Bán hộ (Affiliate Out)</option>
              <option value="PRE_ORDER">Hàng Order (Pre-order)</option>
              <option value="AFFILIATE_HOST">Cho phép CTV khác bán (Affiliate In)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Loại cũ (Fallback)</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            >
              <option value="ROBOT_STEM">Robot Thông Minh</option>
              <option value="KIT_ARDUINO">Kit Arduino</option>
              <option value="DO_CHOI_LOGIC">Đồ chơi Logic</option>
              <option value="PHU_KIEN">Phụ Kiện</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col justify-start gap-2">
            <Label htmlFor="price">Giá bán hiện tại (VNĐ)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              required
            />
          </div>
          <div className="flex flex-col justify-start gap-2">
            <Label htmlFor="originalPrice">Giá gốc (VNĐ) - Tuỳ chọn</Label>
            <Input
              id="originalPrice"
              type="number"
              min="0"
              value={formData.originalPrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  originalPrice: Number(e.target.value),
                })
              }
              readOnly={formData.isCombo}
              className={formData.isCombo ? "bg-neutral-100 cursor-not-allowed" : ""}
            />
            {formData.isCombo && (
              <span className="text-xs text-muted-foreground mt-1">
                *Giá gốc tự động tính bằng tổng giá bán rời của Combo.
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Fields Based on Supply Type */}
        {formData.supplyType === "AFFILIATE_SELL" && (
          <div className="space-y-2 border-l-4 border-orange-500 pl-4 py-2">
            <Label htmlFor="externalAffiliateLink">Link Sàn Phụ (Shopee/Lazada)</Label>
            <Input
              id="externalAffiliateLink"
              type="url"
              placeholder="https://shopee.vn/..."
              value={formData.externalAffiliateLink}
              onChange={(e) =>
                setFormData({ ...formData, externalAffiliateLink: e.target.value })
              }
            />
          </div>
        )}

        {formData.supplyType === "AFFILIATE_HOST" && (
          <div className="space-y-2 border-l-4 border-green-500 pl-4 py-2">
            <Label htmlFor="commissionRate">Tỷ lệ Hoa hồng CTV (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              value={formData.commissionRate}
              onChange={(e) =>
                setFormData({ ...formData, commissionRate: Number(e.target.value) })
              }
            />
          </div>
        )}

        {formData.supplyType === "PRE_ORDER" && (
          <div className="grid grid-cols-2 gap-4 border-l-4 border-blue-500 pl-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="depositPercent">Tỷ lệ Cọc (%)</Label>
              <Input
                id="depositPercent"
                type="number"
                min="0"
                max="100"
                value={formData.depositPercent}
                onChange={(e) =>
                  setFormData({ ...formData, depositPercent: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedArrivalDate">Ngày Hàng Về (Dự kiến)</Label>
              <Input
                id="estimatedArrivalDate"
                type="datetime-local"
                value={formData.estimatedArrivalDate}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedArrivalDate: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Educational Metadata Section */}
        <div className="border rounded-md p-4 bg-indigo-50/30 space-y-4">
          <div>
            <Label className="text-base font-bold text-indigo-600">
              Phân loại Giáo dục (RoboEQ)
            </Label>
            <p className="text-xs text-muted-foreground">
              Các trường này giúp phân loại sản phẩm theo định hướng giáo dục
              mới.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ageRange">Độ tuổi phù hợp</Label>
              <select
                id="ageRange"
                value={formData.ageRange}
                onChange={(e) =>
                  setFormData({ ...formData, ageRange: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="">-- Bỏ qua --</option>
                <option value="AGE_3_5">3 - 5 tuổi</option>
                <option value="AGE_6_8">6 - 8 tuổi</option>
                <option value="AGE_9_12">9 - 12 tuổi</option>
                <option value="AGE_12_PLUS">Trên 12 tuổi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primarySkill">Kỹ năng phát triển</Label>
              <select
                id="primarySkill"
                value={formData.primarySkill}
                onChange={(e) =>
                  setFormData({ ...formData, primarySkill: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="">-- Bỏ qua --</option>
                <option value="LOGIC">Tư duy Logic</option>
                <option value="LANGUAGE">Ngoại ngữ</option>
                <option value="MOTOR_SKILLS">Vận động</option>
                <option value="EQ">Cảm xúc (EQ)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="educationalGoal">Mục tiêu giáo dục cụ thể</Label>
            <Input
              id="educationalGoal"
              placeholder="VD: Rèn luyện tính kiên nhẫn và khả năng giải quyết vấn đề"
              value={formData.educationalGoal}
              onChange={(e) =>
                setFormData({ ...formData, educationalGoal: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t mt-4">
            <div>
              <Label className="text-base font-bold text-indigo-600">
                Sản phẩm này là một Gói Combo?
              </Label>
              <p className="text-xs text-muted-foreground">
                Đánh dấu nếu đây là một gói bán gộp nhiều đồ chơi lại với nhau.
              </p>
            </div>
            <label
              className={`relative inline-flex items-center ${forceComboMode ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.isCombo}
                disabled={forceComboMode}
                onChange={(e) =>
                  setFormData({ ...formData, isCombo: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {formData.isCombo && (
            <div className="mt-4 border-t-2 border-indigo-200 pt-4 space-y-4 bg-white p-4 rounded-md shadow-sm">
              <div>
                <Label className="text-base font-bold text-indigo-700">
                  2. Chọn các đồ chơi gộp vào Combo này
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Bấm vào hộp bên dưới để chọn những sản phẩm bạn muốn gộp chung
                  thành bộ.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">
                    👉 Bấm vào đây để chọn mặt hàng cần thêm...
                  </option>
                  {availableProducts
                    .filter(
                      (p) =>
                        !formData.comboItems.find(
                          (ci: any) => ci.productId === p.id,
                        ),
                    )
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - {p.price.toLocaleString("vi-VN")}đ
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  onClick={() => {
                    if (!selectedProductId) return;
                    const p = availableProducts.find(
                      (x: any) => x.id === selectedProductId,
                    ) as any;
                    if (p) {
                      setFormData({
                        ...formData,
                        comboItems: [
                          ...formData.comboItems,
                          {
                            productId: p.id,
                            quantity: 1,
                            title: p.title,
                            price: p.price,
                            imageUrl: p.imageUrl,
                          },
                        ],
                      });
                      setSelectedProductId("");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Thêm
                </Button>
              </div>

              {formData.comboItems.length > 0 && (
                <div className="space-y-3 mt-4">
                  {formData.comboItems.map((item: any, idx: number) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-2 border rounded-md bg-neutral-50"
                    >
                      {item.imageUrl && (
                        <div className="w-10 h-10 relative rounded overflow-hidden shrink-0">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.price.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.comboItems];
                            newItems[idx].quantity = Number(e.target.value);
                            setFormData({ ...formData, comboItems: newItems });
                          }}
                          className="w-16 h-8 text-center"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              comboItems: formData.comboItems.filter(
                                (_: any, i: number) => i !== idx,
                              ),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-indigo-50 rounded-md border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3 uppercase tracking-wider">
                      Phân tích giá trị Combo
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">
                          1. Tổng giá bán rời (Giá trị thật):
                        </span>
                        <span className="text-sm font-semibold text-neutral-500 line-through">
                          {formData.comboItems
                            .reduce(
                              (acc: number, cur: any) =>
                                acc + cur.price * cur.quantity,
                              0,
                            )
                            .toLocaleString("vi-VN")}
                          đ
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">
                          2. Giá bán Combo (Giá bạn đang đặt):
                        </span>
                        <span className="text-base font-bold text-indigo-700">
                          {(formData.price || 0).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-indigo-200/60">
                        <span className="text-sm font-bold text-neutral-800">
                          Khách hàng tiết kiệm được (Giảm giá):
                        </span>
                        {(() => {
                          const totalRetail = formData.comboItems.reduce(
                            (acc: number, cur: any) =>
                              acc + cur.price * cur.quantity,
                            0,
                          );
                          const comboPrice = formData.price || 0;
                          const savings = totalRetail - comboPrice;
                          const discountPercent =
                            totalRetail > 0
                              ? Math.round((savings / totalRetail) * 100)
                              : 0;

                          if (savings > 0) {
                            return (
                              <span className="text-base font-bold text-[#10B981]">
                                {savings.toLocaleString("vi-VN")}đ (Giảm{" "}
                                {discountPercent}%)
                              </span>
                            );
                          } else if (savings === 0) {
                            return (
                              <span className="text-sm font-medium text-neutral-500">
                                Không có giảm giá (Bằng giá mua rời)
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-sm font-medium text-red-500">
                                Giá Combo đang đắt hơn mua rời!
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-indigo-600/70 mt-3 text-center italic">
                      * Mẹo: Kéo lên trên và điều chỉnh ô "Giá bán hiện tại" để
                      thay đổi mức Giảm giá này.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col justify-end gap-2">
            <Label htmlFor="inventoryCount">Tồn kho chung (Nếu không có biến thể)</Label>
            <Input
              id="inventoryCount"
              type="number"
              min="0"
              value={formData.inventoryCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  inventoryCount: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <Label htmlFor="sku">SKU Chung</Label>
            <Input
              id="sku"
              value={formData.sku || ""}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              placeholder="Ví dụ: SKU-001"
            />
          </div>
        </div>

        {/* VARIANT MANAGER */}
        <VariantManager 
          variants={formData.variants}
          basePrice={formData.price}
          onChange={(newVariants) => setFormData({ ...formData, variants: newVariants })}
        />

        {/* Flash Sale Section */}
        <div className="border rounded-md p-4 bg-orange-50/30 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Label className="text-base font-bold text-orange-600">
                Flash Sale & Khuyến Mãi
              </Label>
              <p className="text-xs text-muted-foreground">
                Kích hoạt để hiển thị banner Flash Sale và bộ đếm ngược.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.flashSaleActive}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    flashSaleActive: e.target.checked,
                  })
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {formData.flashSaleActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="flashSaleEndDate">Thời gian kết thúc</Label>
                <Input
                  id="flashSaleEndDate"
                  type="datetime-local"
                  value={formData.flashSaleEndDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      flashSaleEndDate: e.target.value,
                    })
                  }
                  required={formData.flashSaleActive}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flashSaleStock">Số lượng Flash Sale</Label>
                <Input
                  id="flashSaleStock"
                  type="number"
                  min="0"
                  value={formData.flashSaleStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      flashSaleStock: Number(e.target.value),
                    })
                  }
                  required={formData.flashSaleActive}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Hình ảnh Sản phẩm</Label>
          <div className="flex gap-4 items-center">
            {formData.imageUrl && (
              <div className="relative w-16 h-16 shrink-0">
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md border bg-neutral-50"
                  sizes="64px"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const data = new FormData();
                data.append("file", file);
                toast.loading("Đang tải ảnh lên...", { id: "upload" });
                try {
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    body: data,
                  });
                  const result = await res.json();
                  if (result.success) {
                    setFormData({ ...formData, imageUrl: result.url });
                    toast.success("Tải ảnh thành công", { id: "upload" });
                  } else {
                    toast.error(result.error || "Lỗi tải ảnh", {
                      id: "upload",
                    });
                  }
                } catch (err) {
                  toast.error("Lỗi kết nối", { id: "upload" });
                }
              }}
            />
          </div>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            placeholder="Hoặc nhập URL trực tiếp..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả sản phẩm</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e: any) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={5}
            required
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(forceComboMode ? "/admin/combos" : "/admin/products")
          }
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? "Cập nhật" : "Tạo sản phẩm"}
        </Button>
      </div>
    </form>
  );
}
