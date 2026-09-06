import { getSettings } from "@/actions/admin";
import { SettingsForm } from "./components/settings-form";

export const metadata = {
  title: "Cài đặt | Admin",
};

export default async function SettingsPage() {
  const res = await getSettings();
  const initialSettings = res.success && res.data ? res.data : {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-muted-foreground">
          Quản lý các thông tin chung của website như tên cửa hàng, liên hệ, mạng xã hội.
        </p>
      </div>
      
      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
