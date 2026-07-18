"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertProduct } from "@/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export function ProductForm({ initialData, categories = [] }: { initialData?: any, categories?: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price ? Number(initialData.price) : 0,
    type: initialData?.type || "ROBOT_STEM", // fallback enum
    categoryId: initialData?.categoryId || categories[0]?.id || "", // new category link
    inventoryCount: initialData?.inventoryCount || 0,
    imageUrl: initialData?.imageUrl || "",
    originalPrice: initialData?.originalPrice ? Number(initialData.originalPrice) : 0,
    flashSaleActive: initialData?.flashSaleActive || false,
    flashSaleEndDate: initialData?.flashSaleEndDate ? new Date(initialData.flashSaleEndDate).toISOString().slice(0, 16) : "",
    flashSaleStock: initialData?.flashSaleStock || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const res = await upsertProduct(formData, initialData?.id)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(initialData ? "Cập nhật thành công" : "Thêm mới thành công")
      router.push("/admin/products")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-md border shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Tên sản phẩm</Label>
          <Input 
            id="title" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Danh mục</Label>
            <select 
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            >
              {categories.length > 0 ? categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              )) : (
                <option value="">-- Chưa có danh mục --</option>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Loại cũ (Fallback)</Label>
            <select 
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            >
              <option value="ROBOT_STEM">Robot Thông Minh</option>
              <option value="KIT_ARDUINO">Kit Arduino</option>
              <option value="DO_CHOI_LOGIC">Đồ chơi Logic</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Giá bán hiện tại (VNĐ)</Label>
            <Input 
              id="price" 
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Giá gốc (VNĐ) - Tuỳ chọn</Label>
            <Input 
              id="originalPrice" 
              type="number"
              min="0"
              value={formData.originalPrice}
              onChange={(e) => setFormData({...formData, originalPrice: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inventoryCount">Tồn kho chung</Label>
          <Input 
            id="inventoryCount" 
            type="number"
            min="0"
            value={formData.inventoryCount}
            onChange={(e) => setFormData({...formData, inventoryCount: Number(e.target.value)})}
            required
          />
        </div>

        {/* Flash Sale Section */}
        <div className="border rounded-md p-4 bg-orange-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-bold text-orange-600">Flash Sale & Khuyến Mãi</Label>
              <p className="text-xs text-muted-foreground">Kích hoạt để hiển thị banner Flash Sale và bộ đếm ngược.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.flashSaleActive}
                onChange={(e) => setFormData({...formData, flashSaleActive: e.target.checked})}
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
                  onChange={(e) => setFormData({...formData, flashSaleEndDate: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, flashSaleStock: Number(e.target.value)})}
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
                <Image src={formData.imageUrl} alt="Preview" fill className="object-cover rounded-md border bg-neutral-50" sizes="64px" />
              </div>
            )}
            <Input 
              type="file" 
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const data = new FormData();
                data.append('file', file);
                toast.loading('Đang tải ảnh lên...', { id: 'upload' });
                try {
                  const res = await fetch('/api/upload', { method: 'POST', body: data });
                  const result = await res.json();
                  if (result.success) {
                    setFormData({...formData, imageUrl: result.url});
                    toast.success('Tải ảnh thành công', { id: 'upload' });
                  } else {
                    toast.error(result.error || 'Lỗi tải ảnh', { id: 'upload' });
                  }
                } catch (err) {
                  toast.error('Lỗi kết nối', { id: 'upload' });
                }
              }}
            />
          </div>
          <Input 
            id="imageUrl" 
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            placeholder="Hoặc nhập URL trực tiếp..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả sản phẩm</Label>
          <Textarea 
            id="description" 
            value={formData.description}
            onChange={(e: any) => setFormData({...formData, description: e.target.value})}
            rows={5}
            required
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Hủy
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? "Cập nhật" : "Tạo sản phẩm"}
        </Button>
      </div>
    </form>
  )
}
