"use client";

import { useState } from "react";
import { Event, EventPrize } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Coins, AlertTriangle } from "lucide-react";
import { exchangePoints } from "@/actions/event";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface EventWithPrizes extends Event {
  prizes: EventPrize[];
}

interface PointExchangeClientPageProps {
  event: EventWithPrizes;
  initialBalance: number;
  userId?: string;
}

export default function PointExchangeClientPage({ event, initialBalance, userId }: PointExchangeClientPageProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [exchanging, setExchanging] = useState<string | null>(null);
  const router = useRouter();

  // Parse UI Config
  let uiConfig: Record<string, string> = { bgColor: "#fef3c7" }; // default amber-50
  try {
    if (event.uiConfig) {
      uiConfig = { ...uiConfig, ...(event.uiConfig as Record<string, string>) };
    }
  } catch {
    // Ignore error
  }

  const handleExchange = async (prizeId: string, pointCost: number) => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để đổi quà!");
      router.push("/login");
      return;
    }
    
    if (balance < pointCost) {
      toast.error(`Bạn không đủ Xu. Cần thêm ${pointCost - balance} Xu!`);
      return;
    }

    try {
      setExchanging(prizeId);
      const wonPrize = await exchangePoints(event.id, prizeId);
      
      setBalance(prev => prev - pointCost);
      toast.success(`Chúc mừng! Bạn đã đổi thành công: ${wonPrize.name}`);
      
      router.refresh(); // refresh stock
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setExchanging(null);
    }
  };

  return (
    <div 
      className="min-h-screen py-12"
      style={{ backgroundColor: uiConfig.bgColor }}
    >
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Banner */}
        {event.bannerUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg relative h-64 md:h-80 w-full">
            <Image 
              src={event.bannerUrl} 
              alt={event.name} 
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-neutral-800 drop-shadow-sm mb-4">
            {event.name}
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {event.description}
          </p>
        </div>

        {/* User Balance */}
        {userId && (
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur border border-orange-200 px-6 py-3 rounded-full flex items-center gap-3 shadow-sm">
              <span className="text-neutral-600 font-medium">Số dư hiện tại:</span>
              <div className="flex items-center gap-1.5 font-bold text-orange-600 text-xl">
                <Coins className="w-5 h-5" />
                {balance.toLocaleString('vi-VN')} Xu
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content (Prizes) */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.prizes.map(prize => {
                const isOutOfStock = prize.stock !== null && prize.stock <= 0;
                
                return (
                  <div 
                    key={prize.id}
                    className={`bg-white rounded-xl p-5 border-2 transition-all ${
                      isOutOfStock ? 'border-neutral-200 opacity-60' : 'border-orange-100 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-neutral-800 leading-tight">
                          {prize.name}
                        </h3>
                        {prize.stock !== null && (
                          <div className="text-sm text-neutral-500 mt-1">
                            Còn lại: <span className="font-bold">{prize.stock}</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-orange-100 text-orange-700 p-2 rounded-lg shrink-0 ml-3">
                        <Gift className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-1 font-black text-orange-600 text-xl">
                        <Coins className="w-5 h-5" />
                        {prize.pointCost.toLocaleString('vi-VN')}
                      </div>
                      <Button
                        onClick={() => handleExchange(prize.id, prize.pointCost)}
                        disabled={isOutOfStock || exchanging === prize.id}
                        className={isOutOfStock ? "bg-neutral-300 text-neutral-500" : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:from-orange-600 hover:to-red-600"}
                      >
                        {exchanging === prize.id ? "Đang đổi..." : isOutOfStock ? "Hết quà" : "Đổi ngay"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar (Rules) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-neutral-800">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Thể Lệ Sự Kiện
              </h2>
              <div className="prose prose-sm text-neutral-600 max-w-none">
                {event.rules ? (
                  <div dangerouslySetInnerHTML={{ __html: event.rules.replace(/\n/g, '<br/>') }} />
                ) : (
                  <p className="italic text-neutral-400">Chưa có thể lệ cụ thể cho sự kiện này.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
