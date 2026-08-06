"use client";

import { useState } from "react";
import { Event } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Calendar, Trophy, Gamepad2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { deleteEvent, createEvent, updateEvent } from "@/actions/admin-event";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventWithCounts extends Event {
  _count: { prizes: number; histories: number };
}

interface AdminEventsClientPageProps {
  events: EventWithCounts[];
}

const defaultStartDate = new Date().toISOString().split('T')[0];
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
const defaultEndDate = nextMonth.toISOString().split('T')[0];

export default function AdminEventsClientPage({ events: initialEvents }: AdminEventsClientPageProps) {
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithCounts | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    rules: "",
    uiConfig: "{}",
    type: "LUCKY_WHEEL",
    pricePerPlay: 10000,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    bannerUrl: "",
    isActive: true
  });

  const handleOpenModal = (event?: EventWithCounts) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        name: event.name,
        slug: event.slug,
        description: event.description || "",
        rules: event.rules || "",
        uiConfig: event.uiConfig ? JSON.stringify(event.uiConfig) : "{}",
        type: event.type,
        pricePerPlay: event.pricePerPlay,
        startDate: new Date(event.startDate).toISOString().split('T')[0],
        endDate: new Date(event.endDate).toISOString().split('T')[0],
        bannerUrl: event.bannerUrl || "",
        isActive: event.isActive
      });
    } else {
      setEditingEvent(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        rules: "",
        uiConfig: "{}",
        type: "LUCKY_WHEEL",
        pricePerPlay: 10000,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        bannerUrl: "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      let parsedUiConfig = null;
      try {
        if (formData.uiConfig.trim()) {
          parsedUiConfig = JSON.parse(formData.uiConfig);
        }
      } catch {
        toast.error("Cấu hình giao diện (JSON) không hợp lệ!");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        uiConfig: parsedUiConfig,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };

      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, payload);
        setEvents(events.map(e => e.id === updated.id ? { ...updated, _count: e._count } : e));
        toast.success("Đã cập nhật sự kiện!");
      } else {
        const created = await createEvent(payload);
        setEvents([{ ...created, _count: { prizes: 0, histories: 0 } }, ...events]);
        toast.success("Đã tạo sự kiện mới!");
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa sự kiện sẽ xóa luôn phần thưởng và lịch sử. Bạn có chắc chắn?")) return;
    try {
      await deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success("Đã xóa sự kiện");
    } catch {
      toast.error("Không thể xóa sự kiện");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">Quản lý Sự Kiện & Minigame</h1>
        <Button onClick={() => handleOpenModal()} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tạo Sự Kiện
        </Button>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800">
          <p className="font-bold mb-1">Hướng dẫn Cấu hình:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tạo Sự kiện trước, sau đó bấm vào nút <strong>Cấu hình Vật phẩm</strong> để cài đặt các ô quà trong Vòng Quay.</li>
            <li><strong>Tỉ lệ %:</strong> Đây là độ xanh chín. Bạn có thể tự do set % rớt đồ cho từng vật phẩm (Tổng = 100%).</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Tên Sự Kiện</th>
                <th className="px-6 py-4 font-bold">Trạng Thái</th>
                <th className="px-6 py-4 font-bold">Giá 1 lượt</th>
                <th className="px-6 py-4 font-bold">Vật phẩm</th>
                <th className="px-6 py-4 font-bold">Lượt chơi</th>
                <th className="px-6 py-4 font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <Gamepad2 className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
                    Chưa có sự kiện nào được tạo.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-800">{event.name}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {event.isActive ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Đang chạy</span>
                      ) : (
                        <span className="bg-neutral-100 text-neutral-500 px-2 py-1 rounded text-xs font-bold">Tạm dừng</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-orange-500">
                      {event.pricePerPlay.toLocaleString('vi-VN')} Xu
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-neutral-700">{event._count.prizes}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-neutral-700">{event._count.histories}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/events/${event.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" title="Cấu hình vật phẩm">
                            <Trophy className="w-4 h-4 mr-1" /> Cấu hình
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenModal(event)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Cập nhật Sự Kiện" : "Tạo Sự Kiện Mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label>Tên Sự kiện</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({...formData, name: val, slug: val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')});
                }} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Đường dẫn (Slug)</Label>
              <Input 
                value={formData.slug} 
                onChange={(e) => setFormData({...formData, slug: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Mô tả</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Giá 1 lượt quay (Xu)</Label>
                <Input 
                  type="number"
                  value={formData.pricePerPlay} 
                  onChange={(e) => setFormData({...formData, pricePerPlay: Number(e.target.value)})} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Loại sự kiện</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="LUCKY_WHEEL">Vòng Quay May Mắn</option>
                  <option value="POINT_EXCHANGE">Tích Điểm Đổi Quà</option>
                  <option value="MYSTERY_BOX">Hộp Mù (Sắp ra mắt)</option>
                </select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Thể lệ (Quy tắc sự kiện - Tùy chọn)</Label>
              <Textarea 
                placeholder="Nhập thể lệ, cách chơi, quy tắc đổi điểm..."
                value={formData.rules} 
                onChange={(e) => setFormData({...formData, rules: e.target.value})} 
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Cấu hình Giao diện (JSON - Tùy chọn)</Label>
              <Textarea 
                placeholder='{"bgColor": "#ffffff"}'
                value={formData.uiConfig} 
                onChange={(e) => setFormData({...formData, uiConfig: e.target.value})} 
                className="font-mono text-sm"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ngày bắt đầu</Label>
                <Input 
                  type="date"
                  value={formData.startDate} 
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Ngày kết thúc</Label>
                <Input 
                  type="date"
                  value={formData.endDate} 
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Kích hoạt Sự kiện (Cho phép người dùng chơi)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={loading || !formData.name} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
              {loading ? "Đang lưu..." : "Lưu Sự Kiện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
