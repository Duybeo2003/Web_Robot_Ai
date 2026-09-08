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
      <div className="bg-gradient-to-r from-[#E30019] to-[#FF5722] rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between text-white shadow-sm gap-2">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
          <Flame className="w-5 h-5 animate-pulse text-yellow-300" />
          <span>Flash Sale Đang Diễn Ra</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="opacity-90">Kết thúc sau:</span>
          <div className="flex items-center gap-1 font-mono font-bold">
            <span className="bg-white text-[#E30019] px-1.5 py-0.5 rounded-sm shadow-sm">
              {hours.toString().padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="bg-white text-[#E30019] px-1.5 py-0.5 rounded-sm shadow-sm">
              {minutes.toString().padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="bg-white text-[#E30019] px-1.5 py-0.5 rounded-sm shadow-sm">
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {stock !== null && stock > 0 && stock <= 10 && (
        <div className="flex items-center gap-1.5 rounded-sm border border-orange-100 bg-orange-50/50 p-3 text-xs font-medium text-red-600">
          <Flame className="w-4 h-4" aria-hidden="true" />
          <span>
            Còn <strong className="text-sm text-red-700">{stock}</strong> sản phẩm
            trong suất Flash Sale
          </span>
        </div>
      )}
    </div>
  );
}
