"use client";

import { useState, useRef } from "react";
import { Event, EventPrize, UserEventHistory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { spinWheel } from "@/actions/event";
import { useRouter } from "next/navigation";
import { Wallet, Info, ArrowLeft, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Define Types
type WinnerWithUser = UserEventHistory & { user: { name: string | null; image: string | null } };
interface LuckyWheelClientPageProps {
  event: Event & { prizes: EventPrize[] };
  recentWinners: WinnerWithUser[];
  userBalance: number;
  isLoggedIn: boolean;
}

export default function LuckyWheelClientPage({ 
  event, 
  recentWinners, 
  userBalance: initialBalance, 
  isLoggedIn 
}: LuckyWheelClientPageProps) {
  const router = useRouter();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [userBalance, setUserBalance] = useState(initialBalance);
  const [wonPrize, setWonPrize] = useState<EventPrize | null>(null);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const prizes = event.prizes.filter(
    (prize) => prize.probability > 0 && (prize.stock === null || prize.stock > 0),
  );
  const totalWeight = prizes.reduce((sum, prize) => sum + prize.probability, 0);
  const sectors = prizes.map((prize, index) => {
    const cumulativeAngle = prizes
      .slice(0, index)
      .reduce(
        (sum, current) =>
          sum + (totalWeight > 0 ? (current.probability / totalWeight) * 360 : 0),
        0,
      );
    const angle = totalWeight > 0 ? (prize.probability / totalWeight) * 360 : 0;
    return {
      prize,
      start: cumulativeAngle,
      end: cumulativeAngle + angle,
      middle: cumulativeAngle + angle / 2,
    };
  });

  const handleSpin = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để tham gia!");
      router.push("/?login=true");
      return;
    }

    if (userBalance < event.pricePerPlay) {
      toast.error("Không đủ xu. Vui lòng nạp thêm để quay.");
      router.push("/profile/wallet");
      return;
    }

    try {
      setIsSpinning(true);
      
      // Deduct balance locally for snappy UI
      setUserBalance(prev => prev - event.pricePerPlay);

      // Call API
      const result = await spinWheel(event.id);
      
      // Calculate rotation
      const winningSector = sectors.find((sector) => sector.prize.id === result.id);
      if (!winningSector) throw new Error("Lỗi xác định phần thưởng");

      const spins = 6;
      const currentAngle = ((rotation % 360) + 360) % 360;
      const alignment = (360 - ((currentAngle + winningSector.middle) % 360)) % 360;
      const targetRotation = spins * 360 + alignment;

      setRotation(prev => prev + targetRotation);

      // Wait for animation to finish (5 seconds)
      setTimeout(() => {
        setIsSpinning(false);
        setWonPrize(result);
        
        // Update balance if it was a point reward
        if (result.rewardPoints > 0) {
          setUserBalance(prev => prev + result.rewardPoints);
        }
        
        router.refresh(); // Refresh recent winners
      }, 5000);

    } catch (error: unknown) {
      setIsSpinning(false);
      setUserBalance(prev => prev + event.pricePerPlay); // Revert balance
      toast.error((error as Error).message || "Có lỗi xảy ra khi quay");
    }
  };

  // Generate Conic Gradient for the wheel
  const colors = ["#FF5722", "#FF9800", "#FFC107", "#E91E63", "#9C27B0", "#2196F3", "#4CAF50", "#00BCD4"];
  const gradientStops = sectors.map((sector, i) => {
    const color = colors[i % colors.length];
    return `${color} ${sector.start}deg ${sector.end}deg`;
  }).join(", ");

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-20 overflow-hidden relative">
      {/* Background FX */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-900/50 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 pt-6 relative z-10">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/events" className="flex items-center text-orange-200 transition-colors hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại sự kiện
          </Link>
          
          <div className="bg-neutral-800/80 backdrop-blur-md border border-neutral-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
            <Wallet className="w-5 h-5 text-orange-400" />
            <div className="font-bold">
              Số dư: <span className="text-orange-400">{userBalance.toLocaleString('vi-VN')} xu</span>
            </div>
            <Link href="/profile/wallet">
              <Button size="sm" className="h-7 px-3 bg-white text-neutral-900 hover:bg-orange-100 text-xs font-bold rounded-full ml-2">
                Nạp
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="mb-4 bg-gradient-to-r from-orange-400 via-primary to-yellow-400 bg-clip-text text-4xl font-black text-transparent drop-shadow-sm md:text-6xl">
            {event.name}
          </h1>
          <p className="text-orange-100/80 text-lg max-w-2xl mx-auto">{event.description}</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24">
          
          {/* THE WHEEL */}
          <div className="relative shrink-0">
            {/* Outer Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            
            {/* Wheel Border */}
            <div className="relative flex aspect-square w-[calc(100vw-2rem)] max-w-[340px] items-center justify-center overflow-hidden rounded-full border-[12px] border-neutral-800 shadow-[0_0_50px_rgba(255,87,34,0.3)] md:w-[480px] md:max-w-none">
              
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-20 flex flex-col items-center">
                <div className="w-8 h-12 bg-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}></div>
              </div>

              {/* Spinning Element */}
              <div 
                ref={wheelRef}
                className="w-full h-full rounded-full relative transition-transform"
                style={{ 
                  background: `conic-gradient(${gradientStops})`,
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "5s" : "0s",
                  transitionTimingFunction: "cubic-bezier(0.15, 0.85, 0.15, 1)" // Easing for natural spin stop
                }}
              >
                {/* Prize Labels */}
                {sectors.map(({ prize, middle }) => {
                  const rotationAngle = middle;
                  return (
                    <div 
                      key={prize.id}
                      className="absolute top-0 left-1/2 w-8 h-1/2 -ml-4 origin-bottom flex items-start justify-center pt-8 text-center"
                      style={{ transform: `rotate(${rotationAngle}deg)` }}
                    >
                      <span className="text-white font-bold text-sm md:text-base drop-shadow-md whitespace-nowrap origin-center -rotate-90">
                        {prize.name}
                      </span>
                    </div>
                  );
                })}
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-neutral-900 rounded-full border-4 border-neutral-700 shadow-inner z-10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-12 text-center">
              <Button 
                onClick={handleSpin}
                disabled={isSpinning}
                className="h-16 w-full max-w-[280px] rounded-full bg-gradient-to-r from-orange-500 to-primary text-xl font-black shadow-[0_0_30px_rgba(255,87,34,0.5)] transition-all hover:scale-105 hover:from-orange-400 hover:to-orange-600 hover:shadow-[0_0_50px_rgba(255,87,34,0.8)]"
              >
                {isSpinning ? "Đang quay..." : `Quay ngay (${event.pricePerPlay} xu)`}
              </Button>
            </div>
          </div>

          {/* Leaderboard & Info */}
          <div className="w-full max-w-md space-y-6">
            <div className="bg-neutral-800/50 backdrop-blur-md border border-neutral-700 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2 border-b border-neutral-700 pb-3">
                <Trophy className="w-5 h-5" />
                Bảng vàng
              </h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {recentWinners.length === 0 ? (
                  <p className="text-neutral-500 text-center py-4">Chưa có người trúng thưởng.</p>
                ) : (
                  recentWinners.map((winner, idx) => (
                    <div key={winner.id} className="flex items-center gap-3 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex flex-col items-center justify-center text-xs font-bold shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-neutral-200 truncate">
                          {winner.user.name || "Khách hàng"}
                        </p>
                        <p className="text-xs text-orange-400 truncate">Vừa trúng: {winner.prizeName}</p>
                      </div>
                      <div className="text-[10px] text-neutral-500 shrink-0">
                        {new Date(winner.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-400 leading-relaxed">
                Chi phí mỗi lượt quay là <strong className="text-orange-400">{event.pricePerPlay} xu</strong>. Phần thưởng vật phẩm sẽ được chuyển vào <strong>túi đồ sự kiện</strong> của bạn.
              </p>
            </div>

            {/* Prize Pool */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 shadow-xl mt-6">
              <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2 border-b border-neutral-700 pb-3">
                <Sparkles className="w-5 h-5" />
                Cơ cấu giải thưởng
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {prizes.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-2">Sự kiện chưa có phần thưởng.</p>
                ) : (
                  [...prizes].sort((a, b) => Number(a.probability) - Number(b.probability)).map((prize) => (
                    <div key={prize.id} className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm text-neutral-200 truncate flex items-center gap-2">
                          {prize.name}
                          {prize.isJackpot && <span className="rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-black text-black">Giải đặc biệt</span>}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {prize.productId ? "Vật phẩm thực" : `Cộng ${prize.rewardPoints} xu`}
                          {prize.stock !== null && ` • Còn: ${prize.stock}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-black text-orange-400">
                          {((prize.probability / totalWeight) * 100).toLocaleString("vi-VN", {
                            maximumFractionDigits: 2,
                          })}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Tỷ lệ được tính trên các phần thưởng còn hàng và được thể hiện theo kích thước từng ô.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Won Prize Dialog */}
      <Dialog open={!!wonPrize} onOpenChange={(open) => !open && setWonPrize(null)}>
        <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
              Chúc mừng bạn!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-8 text-center flex flex-col items-center">
            {wonPrize?.isJackpot && (
              <div className="mb-4">
                <span className="bg-yellow-500 text-neutral-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest animate-bounce inline-block">
                  Giải đặc biệt
                </span>
              </div>
            )}
            
            <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-[#FF5722] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,87,34,0.5)] mb-6">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Bạn đã quay trúng</h3>
            <p className="text-3xl font-black text-[#FF5722] drop-shadow-md">{wonPrize?.name}</p>
            
            {wonPrize?.productId ? (
              <p className="text-neutral-400 mt-4 text-sm">
                Vật phẩm đã được thêm vào <strong className="text-white">Túi đồ sự kiện</strong>. Bạn có thể vào đó để yêu cầu giao hàng hoặc đổi ngược lại ra Xu!
              </p>
            ) : (
              <p className="text-neutral-400 mt-4 text-sm">
                Bạn đã được cộng <strong className="text-orange-400">{wonPrize?.rewardPoints} xu</strong> trực tiếp vào ví RoboCoin!
              </p>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700" onClick={() => setWonPrize(null)}>
              Quay tiếp
            </Button>
            <Link href="/profile/inventory" className="w-full">
              <Button className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold">
                Vào túi đồ
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
