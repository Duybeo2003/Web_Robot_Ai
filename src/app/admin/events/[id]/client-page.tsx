"use client";

import { useState } from "react";
import { Event, EventPrize } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createPrize, updatePrize, deletePrize } from "@/actions/admin-event";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductBasic = { id: string; title: string; price: unknown };

interface EventConfigClientPageProps {
  event: Event & { prizes: EventPrize[] };
  products: ProductBasic[];
}

export default function EventConfigClientPage({ event, products }: EventConfigClientPageProps) {
  const [prizes, setPrizes] = useState(event.prizes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<EventPrize | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    probability: 0,
    pointCost: 0,
    sellPriceXu: "",
    productId: "",
    rewardPoints: 0,
    stock: "",
    isJackpot: false,
  });

  const totalProbability = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
  const isWheel = event.type === "LUCKY_WHEEL";
  const probabilityReady = !isWheel || Math.abs(totalProbability - 100) < 0.000_001;

  const handleOpenModal = (prize?: EventPrize) => {
    if (prize) {
      setEditingPrize(prize);
      setFormData({
        name: prize.name,
        probability: Number(prize.probability),
        pointCost: Number(prize.pointCost || 0),
        sellPriceXu: prize.sellPriceXu === null ? "" : prize.sellPriceXu.toString(),
        productId: prize.productId || "",
        rewardPoints: prize.rewardPoints || 0,
        stock: prize.stock === null ? "" : prize.stock.toString(),
        isJackpot: prize.isJackpot,
      });
    } else {
      setEditingPrize(null);
      setFormData({
        name: "",
        probability: 0,
        pointCost: 0,
        sellPriceXu: "",
        productId: "",
        rewardPoints: 0,
        stock: "",
        isJackpot: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        probability: Number(formData.probability),
        pointCost: Number(formData.pointCost),
        sellPriceXu: formData.sellPriceXu === "" ? null : parseInt(formData.sellPriceXu),
        productId: formData.productId || null,
        rewardPoints: Number(formData.rewardPoints),
        stock: formData.stock === "" ? null : parseInt(formData.stock),
        isJackpot: formData.isJackpot,
      };

      if (editingPrize) {
        const updated = await updatePrize(editingPrize.id, payload);
        setPrizes(prizes.map(p => p.id === updated.id ? updated : p));
        toast.success("Đã cập nhật ô thưởng!");
      } else {
        const created = await createPrize(event.id, payload);
        setPrizes([...prizes, created]);
        toast.success("Đã thêm ô thưởng mới!");
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa ô thưởng này?")) return;
    try {
      await deletePrize(id);
      setPrizes(prizes.filter(p => p.id !== id));
      toast.success("Đã xóa");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href="/admin/events" className="shrink-0">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">Cấu hình phần thưởng: {event.name}</h1>
          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
            {isWheel ? "Giá 1 lượt quay" : "Loại sự kiện"}:{" "}
            <strong className="text-orange-500">
              {isWheel ? `${event.pricePerPlay} Xu` : "Đổi Xu lấy quà"}
            </strong>
          </p>
        </div>
      </div>

      <div className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${!probabilityReady || event.isActive ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <div className="min-w-0">
          <h3 className={`font-bold ${!probabilityReady || event.isActive ? 'text-amber-700' : 'text-green-700'}`}>
            {isWheel ? `Tổng tỷ lệ: ${totalProbability}%` : "Danh mục quà đổi Xu"}
          </h3>
          {!probabilityReady && (
            <p className="mt-1 flex items-start gap-1 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Tổng tỷ lệ phải bằng đúng 100% trước khi kích hoạt.
            </p>
          )}
          {event.isActive && (
            <p className="mt-1 flex items-start gap-1 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Hãy tạm dừng sự kiện trước khi sửa phần thưởng.
            </p>
          )}
        </div>
        <Button
          onClick={() => handleOpenModal()}
          disabled={event.isActive}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm ô thưởng
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="hidden border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 md:table-header-group">
              <tr>
                <th className="px-6 py-4 font-bold">Tên Ô Thưởng</th>
                <th className="px-6 py-4 font-bold">Vật Phẩm Gắn Kèm (Nếu trúng quà thực tế)</th>
                <th className="px-6 py-4 font-bold text-center">Xu thưởng (Nếu trúng Xu)</th>
                <th className="px-6 py-4 font-bold text-center">Kho (Còn lại)</th>
                {event.type === "POINT_EXCHANGE" ? (
                  <th className="px-6 py-4 font-bold text-center">Giá đổi (Xu)</th>
                ) : (
                  <th className="px-6 py-4 font-bold text-center">Tỉ Lệ Rớt (%)</th>
                )}
                <th className="px-6 py-4 font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {prizes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 sm:px-6">
                    Vòng quay chưa có phần thưởng nào. Hãy thêm ít nhất 2 ô thưởng.
                  </td>
                </tr>
              ) : (
                prizes.map((prize) => {
                  const product = products.find(p => p.id === prize.productId);
                  return (
                    <tr key={prize.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 md:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 font-bold text-neutral-800">
                              {prize.name}
                              {prize.isJackpot && <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black tracking-wider text-yellow-900">Giải đặc biệt</span>}
                            </div>
                            <p className="mt-1 truncate text-sm text-blue-600">
                              {product?.title || "Không có quà hiện vật"}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Sửa ô thưởng"
                              onClick={() => handleOpenModal(prize)}
                              disabled={event.isActive}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Xóa ô thưởng"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(prize.id)}
                              disabled={event.isActive}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-neutral-50 p-3 text-center">
                          <div>
                            <dt className="text-xs text-neutral-500">Xu thưởng</dt>
                            <dd className="mt-0.5 font-bold text-orange-500">{prize.rewardPoints > 0 ? `+${prize.rewardPoints}` : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-neutral-500">Còn lại</dt>
                            <dd className="mt-0.5 font-semibold">{prize.stock === null ? "Vô hạn" : prize.stock}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-neutral-500">{event.type === "POINT_EXCHANGE" ? "Giá đổi" : "Tỷ lệ"}</dt>
                            <dd className="mt-0.5 font-bold text-green-600">
                              {event.type === "POINT_EXCHANGE"
                                ? `${Number(prize.pointCost || 0).toLocaleString("vi-VN")} xu`
                                : `${Number(prize.probability)}%`}
                            </dd>
                          </div>
                        </dl>
                      </td>
                      <td className="hidden px-6 py-4 md:table-cell">
                        <div className="font-bold text-neutral-800 flex items-center gap-2">
                          {prize.name}
                          {prize.isJackpot && <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black tracking-wider text-yellow-900">Giải đặc biệt</span>}
                        </div>
                      </td>
                      <td className="hidden px-6 py-4 md:table-cell">
                        {product ? (
                          <div className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{product.title}</div>
                        ) : (
                          <span className="text-neutral-400 italic">Không có</span>
                        )}
                      </td>
                      <td className="hidden px-6 py-4 text-center font-bold text-orange-500 md:table-cell">
                        {prize.rewardPoints > 0 ? `+${prize.rewardPoints}` : "-"}
                      </td>
                      <td className="hidden px-6 py-4 text-center font-medium md:table-cell">
                        {prize.stock === null ? "Vô hạn" : prize.stock}
                      </td>
                      <td className="hidden px-6 py-4 text-center md:table-cell">
                        {event.type === "POINT_EXCHANGE" ? (
                          <span className="font-black text-lg text-orange-500">
                            {Number(prize.pointCost || 0).toLocaleString('vi-VN')} Xu
                          </span>
                        ) : (
                          <span className={`font-black text-lg ${Number(prize.probability) < 5 ? 'text-red-500' : 'text-green-600'}`}>
                            {Number(prize.probability)}%
                          </span>
                        )}
                      </td>
                      <td className="hidden px-6 py-4 text-right md:table-cell">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenModal(prize)}
                            disabled={event.isActive}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(prize.id)}
                            disabled={event.isActive}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPrize ? "Cập nhật ô thưởng" : "Thêm ô thưởng"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tên hiển thị trên vòng quay</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ví dụ: Robot giáo dục, tặng 500 xu..."
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {event.type === "POINT_EXCHANGE" ? (
                <div className="grid gap-2">
                  <Label>Giá đổi (Xu)</Label>
                  <Input 
                    type="number"
                    value={formData.pointCost} 
                    onChange={(e) => setFormData({...formData, pointCost: Number(e.target.value)})} 
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Tỉ lệ trúng (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.probability} 
                    onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})} 
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Kho / giới hạn số lần trúng</Label>
                <Input 
                  type="number"
                  placeholder="Để trống = Vô hạn"
                  value={formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                />
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-4">
              <p className="text-sm font-bold text-orange-800">Phần thưởng (chọn 1 trong 2)</p>
              
              <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Quà thực tế (sản phẩm trong cửa hàng)</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                >
                  <option value="">Không có</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Giá bán lại (xu, tùy chọn)</Label>
                <Input 
                  type="number"
                  placeholder="Để trống nếu không cho bán lại"
                  value={formData.sellPriceXu} 
                  onChange={(e) => setFormData({...formData, sellPriceXu: e.target.value})} 
                />
              </div>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-orange-200"></div>
                <span className="flex-shrink-0 mx-4 text-orange-400 text-xs font-bold uppercase">Hoặc</span>
                <div className="flex-grow border-t border-orange-200"></div>
              </div>

              <div className="grid gap-2">
                <Label>2. Tặng xu (cộng trực tiếp vào ví)</Label>
                <Input 
                  type="number"
                  value={formData.rewardPoints} 
                  onChange={(e) => setFormData({...formData, rewardPoints: Number(e.target.value), productId: ""})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="isJackpot"
                checked={formData.isJackpot}
                onChange={(e) => setFormData({...formData, isJackpot: e.target.checked})}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <Label htmlFor="isJackpot" className="cursor-pointer font-bold leading-5 text-yellow-600">Đánh dấu là giải đặc biệt (hiển thị hiệu ứng pháo hoa)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={loading || !formData.name} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? "Đang lưu..." : "Lưu ô thưởng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
