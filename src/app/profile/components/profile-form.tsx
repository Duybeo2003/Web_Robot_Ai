"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateUserProfile } from "@/actions/user";
import { toast } from "sonner";

 
export function ProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phoneNumber: initialData?.phoneNumber || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await updateUserProfile(formData);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Cập nhật hồ sơ thành công");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Read-only email or phone if email doesn't exist */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4">
          <Label className="text-neutral-600 sm:text-right">Tên đăng nhập</Label>
          <div className="sm:col-span-2">
            <span className="text-sm font-medium">
              {initialData?.email ||
                initialData?.phoneNumber ||
                "Chưa cập nhật"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4">
          <Label htmlFor="name" className="text-neutral-600 sm:text-right">
            Tên
          </Label>
          <div className="sm:col-span-2">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="h-10 border-neutral-200 focus-visible:ring-primary"
              placeholder="Nhập họ và tên"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4">
          <Label htmlFor="phoneNumber" className="text-neutral-600 sm:text-right">
            Số điện thoại
          </Label>
          <div className="sm:col-span-2">
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="h-10 border-neutral-200 focus-visible:ring-primary"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
        <div className="sm:col-span-2 sm:col-start-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full px-8 sm:w-auto"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </div>
      </div>
    </form>
  );
}
