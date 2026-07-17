"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { updateUserProfile } from "@/actions/user"
import { toast } from "sonner"

export function ProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phoneNumber: initialData?.phoneNumber || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const res = await updateUserProfile(formData)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Cập nhật hồ sơ thành công")
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Read-only email or phone if email doesn't exist */}
        <div className="grid grid-cols-3 items-center gap-4">
          <Label className="text-right text-neutral-500">Tên đăng nhập</Label>
          <div className="col-span-2">
            <span className="text-sm font-medium">{initialData?.email || initialData?.phoneNumber || "Chưa cập nhật"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="name" className="text-right text-neutral-500">Tên</Label>
          <div className="col-span-2">
            <Input 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="h-10 border-neutral-200 focus-visible:ring-[#FF5722]"
              placeholder="Nhập họ và tên"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="phoneNumber" className="text-right text-neutral-500">Số điện thoại</Label>
          <div className="col-span-2">
            <Input 
              id="phoneNumber" 
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              className="h-10 border-neutral-200 focus-visible:ring-[#FF5722]"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-4 pt-4">
        <div className="col-start-2 col-span-2">
          <Button type="submit" disabled={loading} className="bg-[#FF5722] hover:bg-[#E64A19] text-white px-8">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </div>
      </div>
    </form>
  )
}
