"use client";

import { useState } from "react";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupWarranty, type WarrantySummary } from "@/actions/warranty";
import { format } from "date-fns";
import Image from "next/image";

export function WarrantyClient() {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
   
  const [result, setResult] = useState<WarrantySummary | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await lookupWarranty(serial.trim());
      if (res.error) {
        setError(res.error);
      } else if (res.warranty) {
        setResult(res.warranty);
      }
    } catch {
      setError("Không thể tra cứu lúc này. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto min-h-[70vh] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Tra cứu bảo hành
          </h1>
          <p className="text-neutral-600">
            Nhập số Serial (SN) in trên vỏ hộp hoặc dưới đáy sản phẩm để kiểm
            tra thời hạn và trạng thái bảo hành.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Số serial sản phẩm"
            placeholder="Ví dụ: RB-123456789"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            minLength={5}
            maxLength={100}
            autoComplete="off"
            className="h-12 text-base sm:h-14 sm:text-lg"
          />
          <Button
            type="submit"
            className="h-12 shrink-0 px-8 font-bold sm:h-14"
            disabled={loading || !serial}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            Tra cứu
          </Button>
        </form>

        {error && (
          <div role="alert" className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        {result && (
          <div className="animate-in space-y-6 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 fade-in slide-in-from-bottom-4 sm:p-7">
            <div className="flex flex-col md:flex-row gap-6">
              {result.product.imageUrl && (
                <div className="w-full md:w-32 h-32 relative bg-neutral-50 rounded-lg p-2 border border-neutral-100 shrink-0">
                  <Image
                    src={result.product.imageUrl}
                    alt={result.product.title}
                    fill
                    sizes="(max-width: 767px) calc(100vw - 72px), 128px"
                    className="object-contain"
                  />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <h3 className="font-bold text-lg text-foreground">
                  {result.product.title}
                </h3>
                <p className="text-sm text-neutral-500">
                  Mã Serial:{" "}
                  <span className="font-mono text-foreground font-semibold">
                    {result.serialNumber}
                  </span>
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-neutral-600 font-medium">
                    Trạng thái:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      result.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : result.status === "EXPIRED"
                          ? "bg-red-100 text-red-700"
                          : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {result.status === "ACTIVE"
                      ? "Còn hạn bảo hành"
                      : result.status === "EXPIRED"
                        ? "Đã hết hạn"
                        : "Từ chối bảo hành"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-neutral-100">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                  Ngày kích hoạt
                </p>
                <p className="font-medium text-foreground">
                  {format(new Date(result.startDate), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                  Ngày hết hạn
                </p>
                <p className="font-medium text-foreground">
                  {format(new Date(result.endDate), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                  Khách hàng
                </p>
                <p className="font-medium text-foreground">
                    {result.user.name || "Chưa cập nhật"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                  Số điện thoại
                </p>
                <p className="font-medium text-foreground">
                    {result.user.phoneNumber || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
