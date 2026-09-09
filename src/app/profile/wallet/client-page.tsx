"use client";

import { useState } from "react";
import { UserWallet, WalletTransaction } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Clock, ArrowDownRight, ArrowUpRight, QrCode } from "lucide-react";
import { createTopupRequest } from "@/actions/wallet";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface WalletClientPageProps {
  wallet: UserWallet;
  transactions: WalletTransaction[];
  bankConfig: { bankId: string; accountNo: string; accountName: string };
}

export default function WalletClientPage({ wallet, transactions, bankConfig }: WalletClientPageProps) {
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<WalletTransaction | null>(null);

  const handleTopup = async () => {
    try {
      if (!bankConfig.bankId || !bankConfig.accountNo || !bankConfig.accountName) {
        toast.error("Kênh nạp Xu bằng chuyển khoản chưa sẵn sàng.");
        return;
      }
      const parsedAmount = parseInt(amount);
      if (isNaN(parsedAmount) || parsedAmount < 10000) {
        toast.error("Số tiền tối thiểu là 10.000đ");
        return;
      }

      setLoading(true);
      const transaction = await createTopupRequest(parsedAmount);
      setActiveTransaction(transaction);
      setIsTopupOpen(false);
      setAmount("");
      toast.success("Đã tạo yêu cầu nạp Xu. Vui lòng chuyển khoản!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "TOPUP":
      case "REWARD":
      case "REFUND":
        return <ArrowDownRight className="w-5 h-5 text-green-600" />;
      case "SPEND":
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Thành công</span>;
      case "PENDING":
        return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Đang chờ duyệt</span>;
      case "REJECTED":
        return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Thất bại</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Ví RoboCoin</h1>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-orange-500 to-[#FF5722] p-8 rounded-xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-orange-100 font-medium flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Số dư hiện tại
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{wallet.balance.toLocaleString('vi-VN')}</span>
            <span className="text-xl font-bold text-orange-100">xu</span>
            </div>
            <p className="text-sm text-orange-100">1 Xu = 1 VNĐ. Dùng để tham gia sự kiện và vòng quay may mắn.</p>
          </div>
          
          <Button 
            onClick={() => setIsTopupOpen(true)}
            size="lg"
            className="bg-white text-[#FF5722] hover:bg-orange-50 font-bold h-14 px-8 rounded-full shadow-md shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nạp xu ngay
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-lg font-bold">Lịch sử giao dịch</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Clock className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
              Chưa có giao dịch nào
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'SPEND' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-bold text-neutral-800">{tx.description || tx.type}</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </p>
                    {tx.providerReference && (
                      <p className="mt-1 text-xs font-mono text-neutral-500">
                        Đối soát: {tx.providerReference}
                      </p>
                    )}
                    <div className="mt-1 sm:hidden">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-right sm:justify-end">
                  <div className="hidden sm:block">
                    {getStatusBadge(tx.status)}
                  </div>
                  <div>
                    <p className={`font-black text-lg ${tx.type === 'SPEND' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'SPEND' ? '-' : '+'}{tx.amount.toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {tx.status === "PENDING" && tx.type === "TOPUP" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTransaction(tx)}
                      className="ml-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <QrCode className="w-4 h-4 mr-1" /> Thanh toán
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Topup Dialog */}
      <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nạp Robo Xu</DialogTitle>
            <DialogDescription>
              Nhập số xu bạn muốn nạp (1 xu = 1 VNĐ). Tối thiểu 10.000 xu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền nạp (VNĐ)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ví dụ: 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg font-bold"
              />
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[50000, 100000, 200000, 500000].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  className={amount === val.toString() ? "border-[#FF5722] text-[#FF5722] bg-orange-50" : ""}
                  onClick={() => setAmount(val.toString())}
                >
                  {val.toLocaleString('vi-VN')}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopupOpen(false)}>Hủy</Button>
            <Button onClick={handleTopup} disabled={loading || !amount} className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
              Tạo yêu cầu nạp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Payment Dialog */}
      <Dialog open={!!activeTransaction} onOpenChange={(open) => !open && setActiveTransaction(null)}>
        <DialogContent className="sm:max-w-[550px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-[#FF5722]">Thanh toán đơn nạp Xu</DialogTitle>
            <DialogDescription className="text-center">
              Quét mã QR dưới đây bằng ứng dụng ngân hàng của bạn để hoàn tất nạp <strong>{activeTransaction?.amount.toLocaleString('vi-VN')} Xu</strong>.
            </DialogDescription>
          </DialogHeader>
          
          {activeTransaction && (
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start py-2">
              <div className="flex flex-col items-center shrink-0">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.vietqr.io/image/${encodeURIComponent(bankConfig.bankId)}-${encodeURIComponent(bankConfig.accountNo)}-compact2.png?amount=${encodeURIComponent(activeTransaction.amount)}&addInfo=${encodeURIComponent(`NAPXU ${activeTransaction.id.slice(-6).toUpperCase()}`)}&accountName=${encodeURIComponent(bankConfig.accountName)}`}
                    alt="Mã VietQR để thanh toán"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="mt-2 text-center text-xs font-medium text-gray-500">Mở ứng dụng ngân hàng để quét mã</p>
              </div>

              <div className="w-full flex flex-col space-y-3">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-sm border-b border-orange-200/50 pb-2">
                    <span className="text-orange-800/70">Số tiền:</span>
                    <span className="font-bold text-[#E30019] text-lg">{activeTransaction.amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-orange-200/50 pb-2">
                    <span className="text-orange-800/70">Ngân hàng:</span>
                    <span className="font-bold text-gray-800">{bankConfig.bankId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-orange-200/50 pb-2">
                    <span className="text-orange-800/70">Số tài khoản:</span>
                    <span className="font-bold text-gray-800">{bankConfig.accountNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-800/70">Nội dung:</span>
                    <span className="font-mono font-bold text-[#FF5722]">NAPXU {activeTransaction.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-2.5 rounded-lg text-xs text-center border border-blue-100 shadow-sm leading-relaxed">
                  Xu được cộng sau khi nhân viên đối soát khoản chuyển trong giờ làm việc.
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setActiveTransaction(null)} className="w-full sm:w-auto">Đã chuyển khoản xong</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
