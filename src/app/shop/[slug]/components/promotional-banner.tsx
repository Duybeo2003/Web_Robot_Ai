"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

export function PromotionalBanner({
  isActive,
  endDate,
  stock,
}: {
  isActive: boolean;
  endDate: Date | null;
  stock: number | null;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    if (!isActive || !endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isActive, endDate]);

  // SSR mismatch prevention & condition check
  if (!isClient || !isActive || !endDate || timeLeft <= 0) {
    return null;
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col gap-3 mb-3 w-full">
      {/* Flash Sale Header */}
      <div className="flex flex-col justify-between gap-2 rounded-xl bg-gradient-to-r from-[#E30019] to-primary p-3 text-white shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Flame className="w-5 h-5 text-yellow-300" />
          <span>Ưu đãi nhanh đang diễn ra</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="opacity-90">Kết thúc sau:</span>
          <div className="flex items-center gap-1 font-mono font-bold">
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[#E30019] shadow-sm">
              {hours.toString().padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[#E30019] shadow-sm">
              {minutes.toString().padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[#E30019] shadow-sm">
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {stock !== null && stock > 0 && stock <= 10 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-xs font-medium text-red-600">
          <Flame className="w-4 h-4" aria-hidden="true" />
          <span>
            Còn <strong className="text-sm text-red-700">{stock}</strong> sản phẩm
            trong chương trình ưu đãi nhanh
          </span>
        </div>
      )}
    </div>
  );
}
