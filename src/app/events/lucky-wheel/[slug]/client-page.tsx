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
  DialogDescription,
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
  const prizes = event.prizes;
  const numPrizes = prizes.length;
  const sliceAngle = 360 / numPrizes;

  const handleSpin = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để tham gia!");
      router.push("/?login=true");
      return;
    }

    if (userBalance < event.pricePerPlay) {
      toast.error("Không đủ Xu! Vui lòng nạp thêm để quay.");
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
      const prizeIndex = prizes.findIndex(p => p.id === result.id);
      if (prizeIndex === -1) throw new Error("Lỗi xác định phần thưởng");

      // We want the winning slice to point upwards (270 degrees in CSS context, or we just align it)
      // The pointer is at the TOP (0 degrees).
      // Each slice is at (i * sliceAngle). We need the center of the winning slice to be at 360 (top).
      // So we rotate by: (Spins * 360) - (prizeIndex * sliceAngle)
      
      const spins = 5 + Math.floor(Math.random() * 3); // 5 to 8 full spins
      // Offset by half a slice so the pointer is in the middle of the slice
      const targetRotation = (spins * 360) - (prizeIndex * sliceAngle); 

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

    } catch (error: any) {
      setIsSpinning(false);
      setUserBalance(prev => prev + event.pricePerPlay); // Revert balance
      toast.error(error.message || "Có lỗi xảy ra khi quay");
    }
  };

  // Generate Conic Gradient for the wheel
  const colors = ["#FF5722", "#FF9800", "#FFC107", "#E91E63", "#9C27B0", "#2196F3", "#4CAF50", "#00BCD4"];
  const gradientStops = prizes.map((_, i) => {
    const color = colors[i % colors.length];
    return `${color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`;
  }).join(", ");

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-20 overflow-hidden relative">
      {/* Background FX */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-900/50 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 pt-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/events" className="flex items-center text-orange-200 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại Hub
          </Link>
          
          <div className="bg-neutral-800/80 backdrop-blur-md border border-neutral-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
            <Wallet className="w-5 h-5 text-orange-400" />
            <div className="font-bold">
              Số dư: <span className="text-orange-400">{userBalance.toLocaleString('vi-VN')} Xu</span>
            </div>
            <Link href="/profile/wallet">
              <Button size="sm" className="h-7 px-3 bg-white text-neutral-900 hover:bg-orange-100 text-xs font-bold rounded-full ml-2">
                Nạp
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-[#FF5722] to-yellow-400 uppercase drop-shadow-sm mb-4">
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
            <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] rounded-full border-[12px] border-neutral-800 shadow-[0_0_50px_rgba(255,87,34,0.3)] flex items-center justify-center overflow-hidden">
              
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
                {prizes.map((prize, i) => {
                  // Position each label in the center of its slice
                  const rotationAngle = (i * sliceAngle) + (sliceAngle / 2);
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
                className="w-full max-w-[280px] h-16 text-xl font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-[#FF5722] hover:from-orange-400 hover:to-orange-600 rounded-full shadow-[0_0_30px_rgba(255,87,34,0.5)] hover:shadow-[0_0_50px_rgba(255,87,34,0.8)] transition-all hover:scale-105"
              >
                {isSpinning ? "Đang quay..." : `Quay ngay (${event.pricePerPlay} Xu)`}
              </Button>
            </div>
          </div>

          {/* Leaderboard & Info */}
          <div className="w-full max-w-md space-y-6">
            <div className="bg-neutral-800/50 backdrop-blur-md border border-neutral-700 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2 border-b border-neutral-700 pb-3">
                <Trophy className="w-5 h-5" />
                BẢNG VÀNG
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
                Chi phí mỗi lượt quay là <strong className="text-orange-400">{event.pricePerPlay} Xu</strong>. Phần thưởng vật phẩm sẽ được chuyển vào <strong>Túi đồ sự kiện</strong> của bạn.
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
              CHÚC MỪNG BẠN!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-8 text-center flex flex-col items-center">
            {wonPrize?.isJackpot && (
              <div className="mb-4">
                <span className="bg-yellow-500 text-neutral-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest animate-bounce inline-block">
                  Jackpot
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
                Bạn đã được cộng <strong className="text-orange-400">{wonPrize?.rewardPoints} Xu</strong> trực tiếp vào Ví RoboCoin!
              </p>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700" onClick={() => setWonPrize(null)}>
              Quay tiếp
            </Button>
            <Link href="/profile/inventory" className="w-full">
              <Button className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold">
                Vào Túi Đồ
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
