"use client";

import { useState } from "react";
import { addAdminByPhone } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function AddAdminModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STORE_MANAGER">("STORE_MANAGER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    setIsLoading(true);
    const res = await addAdminByPhone(phoneNumber, role);
    setIsLoading(false);

    if (res.success) {
      toast.success("Đã thêm quản trị viên thành công!");
      setIsOpen(false);
      setPhoneNumber("");
      setRole("STORE_MANAGER");
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm Quản trị viên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm Quản trị viên</DialogTitle>
            <DialogDescription>
              Cấp quyền Quản trị hoặc Quản lý cấp 2 cho một người dùng đã có trên hệ thống bằng Số điện thoại.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="VD: 0987654321"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Quyền hạn</Label>
              <Select value={role} onValueChange={(val: "ADMIN" | "STORE_MANAGER") => setRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STORE_MANAGER">Quản lý (Cấp 2)</SelectItem>
                  <SelectItem value="ADMIN">Admin (Cấp 1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
