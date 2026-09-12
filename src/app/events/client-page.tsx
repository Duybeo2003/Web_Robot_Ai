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
    <main className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-700 via-primary to-orange-500 px-4 py-12 sm:py-16">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-900 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-white backdrop-blur-md">
            <Flame className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-bold">Sự kiện đang diễn ra</span>
          </div>
          <h1 className="mb-5 text-balance text-4xl font-black tracking-tight text-white drop-shadow-md md:text-6xl">
            Thử vận may, nhận quà ngay
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium leading-8 text-orange-50 md:text-xl">
            Tham gia các vòng quay và sự kiện giới hạn để nhận những phần quà công nghệ hấp dẫn từ RoboEQ.
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="container relative z-20 mx-auto -mt-6 px-4 py-12">
        {events.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-neutral-100">
            <Trophy className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Chưa có sự kiện nào</h2>
            <p className="text-neutral-500">Các sự kiện hấp dẫn đang được chuẩn bị. Bạn vui lòng quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="group mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                {/* Banner */}
                <div className="relative aspect-video bg-neutral-100 overflow-hidden">
                  {event.bannerUrl ? (
                    <Image 
                      src={event.bannerUrl} 
                      alt={event.name} 
                      fill 
                      sizes="(max-width: 767px) calc(100vw - 32px), 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                      <Trophy className="w-16 h-16 text-orange-400 opacity-50" />
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-[#E30019] px-3 py-1.5 text-xs font-black text-white shadow-lg">
                    <Zap className="w-3 h-3 fill-current" />
                    Nổi bật
                  </div>
                </div>

                {/* Content */}
                <div className="relative flex flex-1 flex-col p-6">
                  {/* Floating Price Badge */}
                  <div className="absolute -top-6 right-6 bg-white p-2 rounded-lg shadow-xl border border-neutral-100 flex flex-col items-center justify-center min-w-[4rem]">
                    <span className="text-xs font-bold text-neutral-500">1 lượt</span>
                    <span className="text-lg font-black text-primary leading-none">{event.pricePerPlay}</span>
                    <span className="text-[10px] font-bold text-orange-500">xu</span>
                  </div>

                  <h2 className="mb-2 min-h-14 pr-16 text-xl font-extrabold text-neutral-800 transition-colors line-clamp-2 group-hover:text-primary">
                    {event.name}
                  </h2>
                  <p className="text-sm text-neutral-600 mb-6 line-clamp-2 min-h-[2.5rem]">
                    {event.description || "Tham gia ngay để nhận hàng ngàn phần quà hấp dẫn!"}
                  </p>

                  <div className="mt-auto space-y-4">
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
                      <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-primary text-base font-bold text-white shadow-md transition-all hover:from-orange-600 hover:to-orange-700 group-hover:shadow-orange-500/25">
                        Chơi ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
