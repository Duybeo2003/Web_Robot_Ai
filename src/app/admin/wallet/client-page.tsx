"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveTopup, rejectTopup } from "@/actions/admin-wallet";
import { toast } from "sonner";
import { Check, X, Clock, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface PendingTopup {
  id: string;
  amount: number;
  createdAt: string;
  wallet: {
    id: string;
    user: {
      name: string | null;
      email: string | null;
      phoneNumber: string | null;
      image: string | null;
    };
  };
}

interface AdminWalletClientPageProps {
  pendingTopups: PendingTopup[];
}

export default function AdminWalletClientPage({ pendingTopups }: AdminWalletClientPageProps) {
  const [topups, setTopups] = useState(pendingTopups);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [references, setReferences] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    try {
      setLoadingId(id);
      const result = await approveTopup(id, references[id] || "");
      if (!result.success) throw new Error(result.error);
      setTopups(prev => prev.filter(t => t.id !== id));
      toast.success("Đã duyệt nạp Xu thành công");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setLoadingId(id);
      const result = await rejectTopup(id);
      if (!result.success) throw new Error(result.error);
      setTopups(prev => prev.filter(t => t.id !== id));
      toast.success("Đã từ chối nạp Xu");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Duyệt nạp xu</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-4 font-bold sm:px-6">Yêu cầu nạp xu</th>
                <th className="hidden px-6 py-4 font-bold md:table-cell">Số xu</th>
                <th className="hidden px-6 py-4 font-bold lg:table-cell">Mã yêu cầu</th>
                <th className="hidden px-6 py-4 font-bold xl:table-cell">Thời gian</th>
                <th className="hidden px-6 py-4 font-bold md:table-cell">Mã đối soát ngân hàng</th>
                <th className="hidden px-6 py-4 text-right font-bold md:table-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {topups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
                    Không có yêu cầu nạp Xu nào đang chờ duyệt.
                  </td>
                </tr>
              ) : (
                topups.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="min-w-0 px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={tx.wallet.user.image || undefined} />
                          <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-neutral-800">{tx.wallet.user.name || "Khách hàng"}</p>
                          <p className="truncate text-xs text-neutral-500">{tx.wallet.user.email || tx.wallet.user.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 md:hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-lg font-black text-[#E30019]">+{tx.amount.toLocaleString("vi-VN")} xu</span>
                          <span className="rounded-lg bg-neutral-100 px-2 py-1 font-mono text-xs font-bold text-neutral-700">NAPXU {tx.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-neutral-500">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>
                        <Input
                          aria-label={`Mã đối soát cho yêu cầu ${tx.id}`}
                          placeholder="Nhập mã trên sao kê"
                          minLength={6}
                          maxLength={191}
                          value={references[tx.id] || ""}
                          onChange={(event) => setReferences((current) => ({ ...current, [tx.id]: event.target.value }))}
                          disabled={loadingId === tx.id}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(tx.id)} disabled={loadingId === tx.id}>
                            <X className="mr-1 h-4 w-4" /> Từ chối
                          </Button>
                          <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleApprove(tx.id)} disabled={loadingId === tx.id || (references[tx.id]?.trim().length || 0) < 6}>
                            <Check className="mr-1 h-4 w-4" /> Duyệt
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <div className="font-black text-[#E30019] text-lg">
                        +{tx.amount.toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="font-mono text-sm font-bold bg-neutral-100 px-2 py-1 rounded inline-block text-neutral-700">
                        NAPXU {tx.id.slice(-6).toUpperCase()}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-neutral-600 xl:table-cell">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <Input
                        aria-label={`Mã đối soát cho yêu cầu ${tx.id}`}
                        placeholder="Nhập mã trên sao kê"
                        minLength={6}
                        maxLength={191}
                        value={references[tx.id] || ""}
                        onChange={(event) =>
                          setReferences((current) => ({
                            ...current,
                            [tx.id]: event.target.value,
                          }))
                        }
                        disabled={loadingId === tx.id}
                        className="min-w-44"
                      />
                    </td>
                    <td className="hidden px-6 py-4 text-right md:table-cell">
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
                          disabled={
                            loadingId === tx.id ||
                            (references[tx.id]?.trim().length || 0) < 6
                          }
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
