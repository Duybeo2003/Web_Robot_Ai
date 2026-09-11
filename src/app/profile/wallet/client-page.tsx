"use client";

import { useState } from "react";
import { UserWallet, WalletTransaction } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  Plus,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  QrCode,
  CreditCard,
  Zap,
} from "lucide-react";
import { createTopupRequest, createVnPayWalletTopup } from "@/actions/wallet";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface WalletClientPageProps {
  wallet: UserWallet;
  transactions: WalletTransaction[];
  bankConfig: { bankId: string; accountNo: string; accountName: string };
  vnpayConfigured: boolean;
}

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

export default function WalletClientPage({
  wallet,
  transactions,
  bankConfig,
  vnpayConfigured,
}: WalletClientPageProps) {
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<WalletTransaction | null>(null);
  const searchParams = useSearchParams();

  // Show success toast if redirected back from VNPay
  useEffect(() => {
    if (searchParams.get("payment") === "done") {
      toast.success("Yêu cầu nạp xu đã được ghi nhận. Số dư sẽ cập nhật ngay sau khi VNPay xác nhận.");
    }
  }, [searchParams]);

  const parsedAmount = parseInt(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 10_000;

  const handleBankTransfer = async () => {
    if (!bankConfig.bankId || !bankConfig.accountNo) {
      toast.error("Kênh nạp Xu bằng chuyển khoản chưa sẵn sàng.");
      return;
    }
    if (!isValidAmount) {
      toast.error("Số tiền tối thiểu là 10.000đ");
      return;
    }
    try {
      setLoading(true);
      const transaction = await createTopupRequest(parsedAmount);
      setActiveTransaction(transaction);
      setIsTopupOpen(false);
      setAmount("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleVnPay = async () => {
    if (!isValidAmount) {
      toast.error("Số tiền tối thiểu là 10.000đ");
      return;
    }
    try {
      setLoading(true);
      const result = await createVnPayWalletTopup(parsedAmount);
      // Redirect to VNPay payment gateway
      window.location.href = result.paymentUrl;
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra khi tạo thanh toán VNPay");
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === "SPEND") return <ArrowUpRight className="h-5 w-5 text-red-600" />;
    return <ArrowDownRight className="h-5 w-5 text-green-600" />;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: "bg-green-100 text-green-700",
      PENDING: "bg-amber-100 text-amber-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      COMPLETED: "Thành công",
      PENDING: "Đang chờ",
      REJECTED: "Thất bại",
    };
    const cls = map[status] || "bg-neutral-100 text-neutral-700";
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      TOPUP: "Nạp xu",
      SPEND: "Tiêu xu",
      REWARD: "Phần thưởng",
      REFUND: "Hoàn xu",
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ví RoboCoin</h1>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-[#FF5722] p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium text-orange-100">
              <Wallet className="h-5 w-5" />
              Số dư hiện tại
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">
                {wallet.balance.toLocaleString("vi-VN")}
              </span>
              <span className="text-xl font-bold text-orange-100">xu</span>
            </div>
            <p className="text-sm text-orange-100/80">
              1 xu = 1 VNĐ · Dùng để tham gia sự kiện và vòng quay
            </p>
          </div>

          <Button
            onClick={() => setIsTopupOpen(true)}
            size="lg"
            className="h-14 shrink-0 rounded-full bg-white px-8 font-bold text-[#FF5722] shadow-md hover:bg-orange-50"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nạp xu ngay
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-6">
          <h2 className="text-lg font-bold">Lịch sử giao dịch</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-neutral-400">
              <Clock className="mx-auto mb-3 h-10 w-10 text-neutral-200" />
              <p className="font-medium">Chưa có giao dịch nào</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      tx.type === "SPEND" ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-800 break-words">
                      {tx.description || getTypeName(tx.type)}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {tx.providerReference && (
                      <p className="mt-0.5 font-mono text-xs text-neutral-400">
                        Đối soát: {tx.providerReference}
                      </p>
                    )}
                    <div className="mt-1 sm:hidden">{getStatusBadge(tx.status)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-right sm:justify-end">
                  <div className="hidden sm:block">{getStatusBadge(tx.status)}</div>
                  <p
                    className={`text-lg font-black ${
                      tx.type === "SPEND" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {tx.type === "SPEND" ? "-" : "+"}
                    {tx.amount.toLocaleString("vi-VN")}
                  </p>
                  {tx.status === "PENDING" && tx.type === "TOPUP" && !tx.providerReference && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTransaction(tx)}
                      className="ml-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <QrCode className="mr-1 h-4 w-4" /> QR
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
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Nạp RoboCoin</DialogTitle>
            <DialogDescription>
              Nhập số xu muốn nạp (1 xu = 1 VNĐ). Tối thiểu 10.000 xu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền nạp (VNĐ)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ví dụ: 100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  className={`text-sm ${
                    amount === val.toString()
                      ? "border-[#FF5722] bg-orange-50 text-[#FF5722]"
                      : ""
                  }`}
                  onClick={() => setAmount(val.toString())}
                >
                  {(val / 1000).toFixed(0)}K
                </Button>
              ))}
            </div>

            {isValidAmount && (
              <p className="text-center text-sm text-muted-foreground">
                Bạn sẽ nhận được{" "}
                <strong className="text-[#FF5722]">
                  {parsedAmount.toLocaleString("vi-VN")} xu
                </strong>
              </p>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Chọn phương thức nạp
            </p>

            {/* VNPay option */}
            {vnpayConfigured && (
              <Button
                onClick={handleVnPay}
                disabled={loading || !isValidAmount}
                className="h-12 w-full bg-[#FF5722] font-bold text-white hover:bg-[#E64A19]"
              >
                <Zap className="mr-2 h-5 w-5" />
                Nạp ngay qua VNPay (tự động)
              </Button>
            )}

            {/* Bank transfer option */}
            {bankConfig.bankId && (
              <Button
                onClick={handleBankTransfer}
                disabled={loading || !isValidAmount}
                variant="outline"
                className="h-12 w-full font-medium"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Chuyển khoản ngân hàng (thủ công)
              </Button>
            )}

            {!vnpayConfigured && !bankConfig.bankId && (
              <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-600">
                Hiện tại chưa có kênh nạp xu khả dụng. Vui lòng liên hệ admin.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank QR Dialog */}
      <Dialog
        open={!!activeTransaction}
        onOpenChange={(open) => !open && setActiveTransaction(null)}
      >
        <DialogContent className="overflow-hidden sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-[#FF5722]">
              Thanh toán qua chuyển khoản
            </DialogTitle>
            <DialogDescription className="text-center">
              Quét mã QR hoặc chuyển khoản thủ công để nạp{" "}
              <strong>{activeTransaction?.amount.toLocaleString("vi-VN")} xu</strong>.
            </DialogDescription>
          </DialogHeader>

          {activeTransaction && bankConfig.bankId && (
            <div className="flex flex-col items-center gap-6 py-2 md:flex-row md:items-start">
              <div className="flex shrink-0 flex-col items-center">
                <div className="rounded-xl border border-orange-100 bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.vietqr.io/image/${encodeURIComponent(bankConfig.bankId)}-${encodeURIComponent(bankConfig.accountNo)}-compact2.png?amount=${encodeURIComponent(activeTransaction.amount)}&addInfo=${encodeURIComponent(`NAPXU ${activeTransaction.id.slice(-6).toUpperCase()}`)}&accountName=${encodeURIComponent(bankConfig.accountName)}`}
                    alt="Mã VietQR"
                    className="h-48 w-48 object-contain"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-neutral-400">
                  Mở ứng dụng ngân hàng để quét
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="space-y-2.5 rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
                  {[
                    ["Số tiền", `${activeTransaction.amount.toLocaleString("vi-VN")} VNĐ`],
                    ["Ngân hàng", bankConfig.bankId.toUpperCase()],
                    ["Số tài khoản", bankConfig.accountNo],
                    ["Chủ tài khoản", bankConfig.accountName],
                    ["Nội dung CK", `NAPXU ${activeTransaction.id.slice(-6).toUpperCase()}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2 border-b border-orange-200/50 pb-2 last:border-0 last:pb-0 text-sm"
                    >
                      <span className="text-orange-800/60">{label}</span>
                      <span
                        className={`font-bold ${
                          label === "Nội dung CK"
                            ? "font-mono text-[#FF5722]"
                            : "text-neutral-800"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-center text-xs leading-relaxed text-blue-700">
                  Xu được cộng sau khi nhân viên đối soát (thường trong giờ làm việc).
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setActiveTransaction(null)}
              className="w-full sm:w-auto"
            >
              Đã chuyển khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
