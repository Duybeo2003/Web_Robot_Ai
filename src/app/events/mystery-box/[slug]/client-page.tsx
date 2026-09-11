"use client";

import { useState } from "react";
import { Event, EventPrize, UserEventHistory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { openMysteryBox } from "@/actions/event";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowLeft,
  Trophy,
  Gift,
  Sparkles,
  Package,
  Star,
  Info,
  Crown,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type WinnerWithUser = UserEventHistory & {
  user: { name: string | null; image: string | null };
};

interface MysteryBoxClientPageProps {
  event: Event & { prizes: EventPrize[] };
  recentWinners: WinnerWithUser[];
  userBalance: number;
  isLoggedIn: boolean;
}

// Deterministic star positions (avoids Math.random in render)
const STAR_POSITIONS = Array.from({ length: 30 }, (_, i) => ({
  width: ((i * 7919) % 30) / 10 + 1,
  height: ((i * 6271) % 30) / 10 + 1,
  top: (i * 3571) % 100,
  left: (i * 4973) % 100,
  duration: ((i * 2311) % 30) / 10 + 2,
  delay: ((i * 1777) % 30) / 10,
}));

const BOX_COLORS = [
  { bg: "from-purple-600 to-indigo-700", glow: "rgba(139,92,246,0.6)", accent: "#a78bfa" },
  { bg: "from-rose-500 to-pink-700", glow: "rgba(244,63,94,0.6)", accent: "#fb7185" },
  { bg: "from-amber-500 to-orange-600", glow: "rgba(245,158,11,0.6)", accent: "#fbbf24" },
  { bg: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.6)", accent: "#34d399" },
];

export default function MysteryBoxClientPage({
  event,
  recentWinners,
  userBalance: initialBalance,
  isLoggedIn,
}: MysteryBoxClientPageProps) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [phase, setPhase] = useState<"idle" | "shaking" | "opening" | "revealed">("idle");
  const [wonPrize, setWonPrize] = useState<EventPrize | null>(null);
  const [userBalance, setUserBalance] = useState(initialBalance);
  const [openCount, setOpenCount] = useState(0);

  const colorTheme = BOX_COLORS[openCount % BOX_COLORS.length];

  const prizes = event.prizes.filter(
    (p) => p.probability > 0 && (p.stock === null || p.stock > 0),
  );

  const handleOpen = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để tham gia!");
      router.push("/?login=true");
      return;
    }
    if (userBalance < event.pricePerPlay) {
      toast.error("Không đủ xu. Vui lòng nạp thêm để mở hộp.");
      router.push("/profile/wallet");
      return;
    }

    try {
      setIsOpening(true);
      setPhase("shaking");
      setUserBalance((prev) => prev - event.pricePerPlay);

      // Run API in parallel with animation
      const resultPromise = openMysteryBox(event.id);

      // Shake phase
      await delay(1000);
      setPhase("opening");

      // Opening phase
      await delay(1200);

      const result = await resultPromise;
      setWonPrize(result);
      setPhase("revealed");
      setOpenCount((c) => c + 1);

      if (result.rewardPoints > 0) {
        setUserBalance((prev) => prev + result.rewardPoints);
      }

      router.refresh();
    } catch (error: unknown) {
      setPhase("idle");
      setIsOpening(false);
      setUserBalance((prev) => prev + event.pricePerPlay);
      toast.error((error as Error).message || "Có lỗi xảy ra khi mở hộp");
    }
  };

  const handleCloseDialog = () => {
    setWonPrize(null);
    setPhase("idle");
    setIsOpening(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white pb-20">
      {/* Animated starfield background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a1030_0%,_#0a0a14_60%)]" />
        {STAR_POSITIONS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-60"
            style={{
              width: star.width + "px",
              height: star.height + "px",
              top: star.top + "%",
              left: star.left + "%",
              animation: `pulse ${star.duration}s ease-in-out infinite`,
              animationDelay: star.delay + "s",
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-colors duration-1000"
          style={{ backgroundColor: colorTheme.glow }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-6">
        {/* Nav */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/events"
            className="flex items-center gap-2 text-purple-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" /> Quay lại sự kiện
          </Link>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
            <Wallet className="h-5 w-5 text-purple-400" />
            <span className="font-bold">
              Số dư:{" "}
              <span className="text-purple-300">{userBalance.toLocaleString("vi-VN")} xu</span>
            </span>
            <Link href="/profile/wallet">
              <Button
                size="sm"
                className="ml-2 h-7 rounded-full bg-white px-3 text-xs font-bold text-purple-900 hover:bg-purple-100"
              >
                Nạp
              </Button>
            </Link>
          </div>
        </div>

        {/* Title */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <Sparkles className="h-4 w-4" /> Sự kiện đặc biệt
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-4xl font-black text-transparent drop-shadow-sm md:text-6xl">
            {event.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-purple-100/70">{event.description}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-12 lg:flex-row lg:items-start lg:gap-20">
          {/* Box Area */}
          <div className="flex flex-col items-center">
            {/* The Mystery Box */}
            <div className="relative flex h-64 w-64 items-center justify-center md:h-80 md:w-80">
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-2xl blur-2xl opacity-40 transition-all duration-500"
                style={{
                  backgroundColor: colorTheme.glow,
                  transform: phase === "shaking" ? "scale(1.3)" : "scale(1)",
                }}
              />

              {/* Box */}
              <div
                className={`relative flex h-56 w-56 flex-col items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br shadow-2xl transition-all duration-300 md:h-72 md:w-72 ${colorTheme.bg} ${
                  phase === "shaking"
                    ? "animate-[shake_0.15s_ease-in-out_infinite]"
                    : phase === "opening"
                      ? "scale-110"
                      : "hover:scale-[1.02]"
                }`}
                style={{
                  boxShadow:
                    phase !== "idle"
                      ? `0 0 60px ${colorTheme.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : "0 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {/* Lid */}
                <div
                  className={`absolute -top-4 left-4 right-4 h-10 rounded-t-xl bg-gradient-to-b from-white/30 to-transparent transition-all duration-700 ${
                    phase === "opening" || phase === "revealed"
                      ? "-translate-y-8 rotate-[-15deg] opacity-0"
                      : ""
                  }`}
                />

                {/* Ribbons */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-px bg-white/20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-px w-full bg-white/20" />
                </div>
                {/* Bow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                  <div className="relative flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-white/60 bg-transparent" />
                    <div
                      className="absolute h-4 w-12 rounded-full border-4 border-white/60 bg-transparent"
                      style={{ clipPath: "ellipse(50% 50% at 50% 50%)" }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                  {phase === "idle" && (
                    <>
                      <Gift className="h-16 w-16 text-white/90 drop-shadow-lg" />
                      <p className="text-lg font-bold text-white/90">Hộp Bí Ẩn</p>
                      <p className="text-sm text-white/60">Bên trong là gì?</p>
                    </>
                  )}
                  {phase === "shaking" && (
                    <>
                      <div className="animate-bounce">
                        <Gift className="h-16 w-16 text-white drop-shadow-lg" />
                      </div>
                      <p className="animate-pulse text-lg font-bold text-white">Đang lắc...</p>
                    </>
                  )}
                  {phase === "opening" && (
                    <div className="animate-ping">
                      <Sparkles className="h-20 w-20 text-white" />
                    </div>
                  )}
                  {phase === "revealed" && wonPrize && (
                    <div className="flex flex-col items-center gap-2 px-4">
                      <div className="animate-bounce">
                        {wonPrize.isJackpot ? (
                          <Crown className="h-14 w-14 text-yellow-300 drop-shadow-lg" />
                        ) : (
                          <Star className="h-14 w-14 text-yellow-300 drop-shadow-lg" />
                        )}
                      </div>
                      <p className="text-center text-base font-black text-white">
                        {wonPrize.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sparkles emitting when revealed */}
                {phase === "revealed" && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute h-2 w-2 animate-ping rounded-full bg-yellow-300"
                        style={{
                          top: Math.sin((i * Math.PI * 2) / 8) * 120 + 128 + "px",
                          left: Math.cos((i * Math.PI * 2) / 8) * 120 + 128 + "px",
                          animationDelay: i * 100 + "ms",
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Open Button */}
            <div className="mt-10 text-center">
              <Button
                onClick={handleOpen}
                disabled={isOpening}
                size="lg"
                className="h-14 min-w-[260px] rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-lg font-black shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:scale-105 hover:from-purple-500 hover:to-pink-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.8)] disabled:scale-100 disabled:opacity-70"
              >
                {isOpening ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">✨</span>
                    {phase === "shaking" ? "Lắc hộp..." : "Mở hộp..."}
                  </span>
                ) : (
                  `Mở hộp (${event.pricePerPlay.toLocaleString("vi-VN")} xu)`
                )}
              </Button>
              <p className="mt-3 text-sm text-white/40">
                Mỗi lần mở tốn {event.pricePerPlay.toLocaleString("vi-VN")} xu
              </p>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full max-w-md space-y-5">
            {/* Recent Winners */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-lg font-bold text-purple-300">
                <Trophy className="h-5 w-5" /> Người may mắn gần đây
              </h3>
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {recentWinners.length === 0 ? (
                  <p className="py-4 text-center text-sm text-white/30">Chưa có người thắng giải.</p>
                ) : (
                  recentWinners.map((winner, idx) => (
                    <div
                      key={winner.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                        style={{
                          background:
                            idx === 0
                              ? "linear-gradient(135deg,#f59e0b,#d97706)"
                              : idx === 1
                                ? "linear-gradient(135deg,#9ca3af,#6b7280)"
                                : idx === 2
                                  ? "linear-gradient(135deg,#92400e,#78350f)"
                                  : "rgba(255,255,255,0.1)",
                          color: idx < 3 ? "#000" : "#fff",
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white/90">
                          {winner.user.name || "Khách hàng"}
                        </p>
                        <p className="truncate text-xs text-purple-300">
                          Trúng: {winner.prizeName}
                        </p>
                      </div>
                      <div className="shrink-0 text-[10px] text-white/30">
                        {new Date(winner.createdAt).toLocaleTimeString("vi-VN")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Prize Pool */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-lg font-bold text-purple-300">
                <Package className="h-5 w-5" /> Vật phẩm có thể nhận được
              </h3>
              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {prizes.length === 0 ? (
                  <p className="py-3 text-center text-sm text-white/30">Chưa có vật phẩm.</p>
                ) : (
                  [...prizes]
                    .sort((a, b) => Number(a.probability) - Number(b.probability))
                    .map((prize) => {
                      const totalWeight = prizes.reduce((s, p) => s + p.probability, 0);
                      const pct =
                        totalWeight > 0
                          ? ((prize.probability / totalWeight) * 100).toLocaleString("vi-VN", {
                              maximumFractionDigits: 2,
                            })
                          : "0";
                      return (
                        <div
                          key={prize.id}
                          className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="flex items-center gap-2 truncate text-sm font-bold text-white/90">
                              {prize.isJackpot && (
                                <Crown className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                              )}
                              {prize.name}
                            </p>
                            <p className="mt-0.5 text-xs text-white/40">
                              {prize.productId
                                ? "Vật phẩm thực"
                                : `Cộng ${prize.rewardPoints.toLocaleString("vi-VN")} xu`}
                              {prize.stock !== null && ` • Còn ${prize.stock}`}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-black" style={{ color: colorTheme.accent }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
              <p className="text-sm leading-relaxed text-white/40">
                Chi phí mỗi lần mở là{" "}
                <strong className="text-purple-300">
                  {event.pricePerPlay.toLocaleString("vi-VN")} xu
                </strong>
                . Phần thưởng vật phẩm sẽ vào <strong className="text-white/70">Túi đồ sự kiện</strong> của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Win Dialog */}
      <Dialog open={!!wonPrize && phase === "revealed"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-white/10 bg-[#12101e] text-white sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Chúc mừng!
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-8 text-center">
            {wonPrize?.isJackpot && (
              <div className="mb-4 animate-bounce">
                <span className="rounded-full bg-yellow-400 px-4 py-1 text-xs font-black uppercase tracking-widest text-black">
                  🎉 Giải đặc biệt!
                </span>
              </div>
            )}

            <div
              className="mb-6 flex h-28 w-28 items-center justify-center rounded-full shadow-2xl"
              style={{
                background: `radial-gradient(circle, ${colorTheme.glow}, transparent)`,
                boxShadow: `0 0 60px ${colorTheme.glow}`,
              }}
            >
              {wonPrize?.isJackpot ? (
                <Crown className="h-14 w-14 text-yellow-300" />
              ) : wonPrize?.productId ? (
                <Gift className="h-14 w-14 text-white" />
              ) : (
                <Star className="h-14 w-14 text-yellow-300" />
              )}
            </div>

            <p className="mb-2 text-xl font-bold text-white/70">Bạn nhận được</p>
            <p className="text-3xl font-black" style={{ color: colorTheme.accent }}>
              {wonPrize?.name}
            </p>

            {wonPrize?.productId ? (
              <p className="mt-4 max-w-xs text-sm text-white/50">
                Vật phẩm đã thêm vào{" "}
                <strong className="text-white/80">Túi đồ sự kiện</strong>. Bạn có thể yêu cầu
                giao hàng hoặc đổi ngược ra Xu.
              </p>
            ) : (
              <p className="mt-4 text-sm text-white/50">
                <strong className="text-purple-300">
                  +{wonPrize?.rewardPoints.toLocaleString("vi-VN")} xu
                </strong>{" "}
                đã được cộng vào ví của bạn.
              </p>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={handleCloseDialog}
            >
              Mở tiếp
            </Button>
            <Link href="/profile/inventory" className="w-full">
              <Button
                className="w-full font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, #7c3aed, #db2777)`,
                }}
              >
                Vào túi đồ
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-8px) rotate(-3deg); }
          50% { transform: translateX(8px) rotate(3deg); }
          75% { transform: translateX(-4px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
