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
    } catch {
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cấu hình Vòng Quay: {event.name}</h1>
          <p className="text-neutral-500">Giá 1 lượt quay: <strong className="text-orange-500">{event.pricePerPlay} Xu</strong></p>
        </div>
      </div>

      <div className={`p-4 rounded-xl flex items-center justify-between border ${totalProbability !== 100 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div>
          <h3 className={`font-bold ${totalProbability !== 100 ? 'text-red-700' : 'text-green-700'}`}>
            Tổng Tỉ Lệ: {totalProbability}%
          </h3>
          {totalProbability !== 100 && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-4 h-4" /> Tổng tỉ lệ bắt buộc phải tròn 100% để thuật toán hoạt động chính xác.
            </p>
          )}
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Ô Thưởng
        </Button>
      </div>

      <div className="bg-white rounded-sm border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
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
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    Vòng quay chưa có phần thưởng nào. Hãy thêm ít nhất 2 ô thưởng.
                  </td>
                </tr>
              ) : (
                prizes.map((prize) => {
                  const product = products.find(p => p.id === prize.productId);
                  return (
                    <tr key={prize.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-800 flex items-center gap-2">
                          {prize.name}
                          {prize.isJackpot && <span className="bg-yellow-400 text-yellow-900 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Jackpot</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product ? (
                          <div className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{product.title}</div>
                        ) : (
                          <span className="text-neutral-400 italic">Không có</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-orange-500">
                        {prize.rewardPoints > 0 ? `+${prize.rewardPoints}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {prize.stock === null ? "Vô hạn" : prize.stock}
                      </td>
                      <td className="px-6 py-4 text-center">
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenModal(prize)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(prize.id)}
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
            <DialogTitle>{editingPrize ? "Cập nhật Ô Thưởng" : "Thêm Ô Thưởng"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tên hiển thị trên vòng quay</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="VD: Trúng iPhone 15, Cộng 5000 Xu, Chúc bạn may mắn lần sau..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                  <Label>Tỉ lệ % (Xác suất)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.probability} 
                    onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})} 
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Kho / Giới hạn số lần trúng</Label>
                <Input 
                  type="number"
                  placeholder="Để trống = Vô hạn"
                  value={formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                />
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-4">
              <p className="text-sm font-bold text-orange-800">Phần thưởng (Chọn 1 trong 2)</p>
              
              <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quà Thực tế (Sản phẩm trong Shop)</Label>
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
                <Label>Giá bán lại (Xu - Tuỳ chọn)</Label>
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
                <Label>2. Gắn thưởng Xu (Cộng trực tiếp vào Ví)</Label>
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
              <Label htmlFor="isJackpot" className="cursor-pointer font-bold text-yellow-600">Đánh dấu đây là Ô JACKPOT (Nổ pháo hoa lớn)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={loading || !formData.name} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
              {loading ? "Đang lưu..." : "Lưu Ô Thưởng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
