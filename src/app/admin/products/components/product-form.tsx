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

export function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price ? Number(initialData.price) : 0,
    type: initialData?.type || "ROBOT_STEM",
    inventoryCount: initialData?.inventoryCount || 0,
    imageUrl: initialData?.imageUrl || "",
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-md border">
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

        <div className="space-y-2">
          <Label htmlFor="type">Phân loại</Label>
          <select 
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ROBOT_STEM">Robot Thông Minh</option>
            <option value="KIT_ARDUINO">Kit Arduino</option>
            <option value="DO_CHOI_LOGIC">Đồ chơi Logic</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Giá bán (VNĐ)</Label>
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
            <Label htmlFor="inventoryCount">Tồn kho</Label>
            <Input 
              id="inventoryCount" 
              type="number"
              min="0"
              value={formData.inventoryCount}
              onChange={(e) => setFormData({...formData, inventoryCount: Number(e.target.value)})}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL Hình ảnh</Label>
          <Input 
            id="imageUrl" 
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            placeholder="https://example.com/image.png"
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
