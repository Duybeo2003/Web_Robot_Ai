"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/actions/admin";
import { toast } from "sonner";
import { Save } from "lucide-react";

export function SettingsForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await updateSettings(settings);
    setIsLoading(false);
    if (res.success) {
      toast.success("Đã lưu cấu hình hệ thống");
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-white p-6 rounded-md border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Tên cửa hàng</Label>
          <Input 
            value={settings["store_name"] || ""}
            onChange={(e) => handleChange("store_name", e.target.value)}
            placeholder="RoboEQ Store"
          />
        </div>
        <div className="space-y-2">
          <Label>Số điện thoại Hotline</Label>
          <Input 
            value={settings["hotline"] || ""}
            onChange={(e) => handleChange("hotline", e.target.value)}
            placeholder="0987654321"
          />
        </div>
        <div className="space-y-2">
          <Label>Email liên hệ</Label>
          <Input 
            type="email"
            value={settings["contact_email"] || ""}
            onChange={(e) => handleChange("contact_email", e.target.value)}
            placeholder="contact@roboeq.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Địa chỉ cửa hàng</Label>
          <Input 
            value={settings["store_address"] || ""}
            onChange={(e) => handleChange("store_address", e.target.value)}
            placeholder="Số 1 Đại Cồ Việt, Hà Nội"
          />
        </div>
        <div className="space-y-2">
          <Label>Link Fanpage Facebook</Label>
          <Input 
            value={settings["facebook_url"] || ""}
            onChange={(e) => handleChange("facebook_url", e.target.value)}
            placeholder="https://facebook.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label>Link Zalo</Label>
          <Input 
            value={settings["zalo_url"] || ""}
            onChange={(e) => handleChange("zalo_url", e.target.value)}
            placeholder="https://zalo.me/..."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Dòng thông báo chạy chữ (Marquee Banner)</Label>
          <Input 
            value={settings["marquee_text"] || ""}
            onChange={(e) => handleChange("marquee_text", e.target.value)}
            placeholder="Sale 50% toàn bộ sản phẩm..."
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
        <Save className="w-4 h-4 mr-2" />
        Lưu cấu hình
      </Button>
    </form>
  );
}
