"use client"

import { useEffect, useState } from "react"
import { Timer, Users, Flame } from "lucide-react"

export function PromotionalBanner({ 
  isActive, 
  endDate, 
  stock 
}: { 
  isActive: boolean; 
  endDate: Date | null; 
  stock: number | null; 
}) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [viewers, setViewers] = useState(12)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (!isActive || !endDate) return

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime()
      return difference > 0 ? Math.floor(difference / 1000) : 0
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    const viewersTimer = setInterval(() => {
      setViewers((prev) => {
        const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
        return Math.max(5, Math.min(35, prev + change))
      })
    }, 5000)

    return () => {
      clearInterval(timer)
      clearInterval(viewersTimer)
    }
  }, [isActive, endDate])

  // SSR mismatch prevention & condition check
  if (!isClient || !isActive || !endDate || timeLeft <= 0) {
    return null
  }

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex flex-col gap-3 mb-6 w-full">
      {/* Flash Sale Header */}
      <div className="bg-gradient-to-r from-[#E30019] to-[#FF5722] rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between text-white shadow-sm gap-2">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
          <Flame className="w-5 h-5 animate-pulse text-yellow-300" />
          <span>Flash Sale Đang Diễn Ra</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="opacity-90">Kết thúc sau:</span>
          <div className="flex items-center gap-1 font-mono font-bold">
            <span className="bg-white text-[#E30019] px-1.5 py-0.5 rounded-sm shadow-sm">{hours.toString().padStart(2, '0')}</span>
            <span>:</span>
            <span className="bg-white text-[#E30019] px-1.5 py-0.5 rounded-sm shadow-sm">{minutes.toString().padStart(2, '0')}</span>
            <span>:</span>
            <span className="bg-white text-[#E30019] px-1.5 py-0.5 rounded-sm shadow-sm">{seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* FOMO Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-medium text-neutral-600 bg-orange-50/50 p-3 rounded-sm border border-orange-100">
        <div className="flex items-center gap-1.5 text-orange-600">
          <Users className="w-4 h-4" />
          <span>Đang có <strong className="text-orange-700 text-sm">{viewers}</strong> người cùng xem</span>
        </div>
        
        {stock !== null && stock > 0 && (
          <>
            <div className="w-1 h-1 rounded-full bg-orange-300 hidden sm:block"></div>
            <div className="flex items-center gap-1.5 text-red-600">
              <Flame className="w-4 h-4" />
              <span>Sắp hết hàng! Chỉ còn <strong className="text-red-700 text-sm">{stock}</strong> sản phẩm giá này</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
