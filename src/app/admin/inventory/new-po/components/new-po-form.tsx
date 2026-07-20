"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createInventoryTransaction } from "@/actions/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export function NewPoForm({ products }: { products: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    productId: "",
    type: "IN" as "IN" | "OUT",
    quantity: 1,
    costPrice: "",
    reference: "",
    note: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.productId) {
      setError("Vui lòng chọn sản phẩm.")
      return
    }

    setLoading(true)
    
    const costPriceNum = formData.costPrice ? parseFloat(formData.costPrice) : undefined
    
    const res = await createInventoryTransaction({
      ...formData,
      costPrice: costPriceNum
    })

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push("/admin/inventory")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-sm text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Label>Loại giao dịch</Label>
        <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Nhập Kho (IN)</SelectItem>
            <SelectItem value="OUT">Xuất Kho (OUT)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Sản phẩm</Label>
        <Select value={formData.productId} onValueChange={(val: any) => setFormData({...formData, productId: val || ""})}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title} (Tồn: {p.inventoryCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label>Số lượng {formData.type === "IN" ? "nhập" : "xuất"}</Label>
          <Input 
            type="number" 
            min="1" 
            required 
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
          />
        </div>
        
        {formData.type === "IN" && (
          <div className="space-y-3">
            <Label>Giá vốn / Đơn vị (Tùy chọn)</Label>
            <Input 
              type="number" 
              min="0" 
              placeholder="Ví dụ: 150000"
              value={formData.costPrice}
              onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Mã tham chiếu (Tùy chọn)</Label>
        <Input 
          placeholder="Số PO, Mã Đơn hàng..." 
          value={formData.reference}
          onChange={(e) => setFormData({...formData, reference: e.target.value})}
        />
      </div>

      <div className="space-y-3">
        <Label>Ghi chú</Label>
        <Textarea 
          placeholder="Nhập ghi chú cho giao dịch này..." 
          value={formData.note}
          onChange={(e) => setFormData({...formData, note: e.target.value})}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Xác nhận {formData.type === "IN" ? "Nhập kho" : "Xuất kho"}
      </Button>
    </form>
  )
}
