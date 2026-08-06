"use client";

import { useState } from "react";
import { User, UserWallet, WalletTransaction } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { approveTopup, rejectTopup } from "@/actions/admin-wallet";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PendingTopup extends WalletTransaction {
  wallet: UserWallet & {
    user: User;
  };
}

interface AdminWalletClientPageProps {
  pendingTopups: PendingTopup[];
}

export default function AdminWalletClientPage({ pendingTopups: initialTopups }: AdminWalletClientPageProps) {
  const [topups, setTopups] = useState(initialTopups);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    try {
      setLoadingId(id);
      await approveTopup(id);
      setTopups(topups.filter(t => t.id !== id));
      toast.success("Đã duyệt nạp Xu thành công");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu này?")) return;
    try {
      setLoadingId(id);
      await rejectTopup(id);
      setTopups(topups.filter(t => t.id !== id));
      toast.success("Đã từ chối nạp Xu");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">Duyệt Nạp Xu (VietQR)</h1>
      </div>

      <div className="bg-white rounded-sm border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Người dùng</th>
                <th className="px-6 py-4 font-bold">Số tiền nạp</th>
                <th className="px-6 py-4 font-bold">Mã GD / Nội dung</th>
                <th className="px-6 py-4 font-bold">Thời gian</th>
                <th className="px-6 py-4 font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {topups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
                    Không có yêu cầu nạp Xu nào đang chờ duyệt.
                  </td>
                </tr>
              ) : (
                topups.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={tx.wallet.user.image || undefined} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-neutral-800">{tx.wallet.user.name || "Khách hàng"}</p>
                          <p className="text-xs text-neutral-500">{tx.wallet.user.email || tx.wallet.user.phoneNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-[#E30019] text-lg">
                        +{tx.amount.toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-bold bg-neutral-100 px-2 py-1 rounded inline-block text-neutral-700">
                        NAPXU {tx.id.slice(-6).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(tx.id)}
                          disabled={loadingId === tx.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(tx.id)}
                          disabled={loadingId === tx.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Đã nhận tiền
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
    </div>
  );
}
