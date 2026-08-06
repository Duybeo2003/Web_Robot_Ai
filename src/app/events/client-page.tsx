"use client";

import { Event } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Timer, Zap, Trophy, Flame } from "lucide-react";
import Image from "next/image";

interface EventsClientPageProps {
  events: (Event & { _count: { prizes: number } })[];
}

export default function EventsClientPage({ events }: EventsClientPageProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-600 via-[#FF5722] to-orange-500 py-10 px-4 relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-900 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white mb-6 border border-white/30">
            <Flame className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-sm tracking-wide">SỰ KIỆN ĐANG DIỄN RA</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-white mb-6 tracking-tight drop-shadow-md">
            THỬ VẬN MAY - NHẬN QUÀ NGAY
          </h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-lg md:text-xl font-medium mb-10">
            Tham gia các vòng quay và sự kiện giới hạn để sở hữu các phần quà công nghệ xịn sò với chi phí cực thấp!
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="container mx-auto px-4 py-12 -mt-8 relative z-20">
        {events.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-neutral-100">
            <Trophy className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Chưa có sự kiện nào</h2>
            <p className="text-neutral-500">Các sự kiện hấp dẫn đang được chuẩn bị. Bạn vui lòng quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="bg-white rounded-xl overflow-hidden shadow-lg border border-orange-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group mx-auto w-full max-w-sm"
              >
                {/* Banner */}
                <div className="relative aspect-video bg-neutral-100 overflow-hidden">
                  {event.bannerUrl ? (
                    <Image 
                      src={event.bannerUrl} 
                      alt={event.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                      <Trophy className="w-16 h-16 text-orange-400 opacity-50" />
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-4 left-4 bg-[#E30019] text-white text-xs font-black px-3 py-1.5 rounded-sm uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    HOT
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 relative">
                  {/* Floating Price Badge */}
                  <div className="absolute -top-6 right-6 bg-white p-2 rounded-lg shadow-xl border border-neutral-100 flex flex-col items-center justify-center min-w-[4rem]">
                    <span className="text-xs font-bold text-neutral-500">1 LƯỢT</span>
                    <span className="text-lg font-black text-[#FF5722] leading-none">{event.pricePerPlay}</span>
                    <span className="text-[10px] font-bold text-orange-400">XU</span>
                  </div>

                  <h2 className="text-xl font-heading font-black text-neutral-800 mb-2 group-hover:text-[#FF5722] transition-colors line-clamp-1">
                    {event.name.toUpperCase()}
                  </h2>
                  <p className="text-sm text-neutral-600 mb-6 line-clamp-2 min-h-[2.5rem]">
                    {event.description || "Tham gia ngay để nhận hàng ngàn phần quà hấp dẫn!"}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-neutral-500 font-medium bg-neutral-100 px-3 py-1.5 rounded-full">
                        <Timer className="w-4 h-4 mr-2 text-orange-500" />
                        Đến {new Date(event.endDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="font-bold text-neutral-700">
                        {event._count.prizes} vật phẩm
                      </span>
                    </div>

                    <Link 
                      href={`/events/${
                        event.type === 'LUCKY_WHEEL' ? 'lucky-wheel' : 
                        event.type === 'POINT_EXCHANGE' ? 'point-exchange' : 
                        'mystery-box'
                      }/${event.slug}`} 
                      className="block"
                    >
                      <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-[#FF5722] hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-sm shadow-md transition-all group-hover:shadow-orange-500/25">
                        CHƠI NGAY
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
