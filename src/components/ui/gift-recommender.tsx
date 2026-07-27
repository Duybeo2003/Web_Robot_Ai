"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Baby,
  Smile,
  GraduationCap,
  Puzzle,
  Languages,
  Activity,
  Heart,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { getGiftRecommendations } from "@/actions/shop";

type Step = "AGE" | "SKILL" | "RESULT";

export function GiftRecommender() {
  const [step, setStep] = useState<Step>("AGE");
  const [age, setAge] = useState<string>("");
  const [skill, setSkill] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleAgeSelect = (selectedAge: string) => {
    setAge(selectedAge);
    setStep("SKILL");
  };

  const handleSkillSelect = async (selectedSkill: string) => {
    setSkill(selectedSkill);
    setStep("RESULT");
    setLoading(true);
    const data = await getGiftRecommendations(age, selectedSkill);
    setResults(data);
    setLoading(false);
  };

  const reset = () => {
    setStep("AGE");
    setAge("");
    setSkill("");
    setResults([]);
  };

  return (
    <div className="bg-gradient-to-br from-white via-white to-orange-50/50 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden border border-orange-100 p-6 md:p-8 w-full h-full flex flex-col justify-center relative">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

      <div className="text-center mb-6 relative z-10">
        <h2 className="text-xl md:text-2xl font-extrabold text-neutral-800 tracking-tight flex items-center justify-center gap-2">
          <Smile className="text-[#FF5722]" size={24} /> Trợ Lý Chọn Quà
        </h2>
        <p className="text-neutral-500 text-xs md:text-sm mt-1">
          Tìm quà giáo dục phù hợp cho bé.
        </p>
      </div>

      <div className="relative min-h-[200px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: CHỌN TUỔI */}
          {step === "AGE" && (
            <motion.div
              key="step-age"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <h3 className="text-sm font-bold text-neutral-700 bg-white/80 px-4 py-1 rounded-full shadow-sm border border-neutral-100">
                Bé nhà bạn mấy tuổi?
              </h3>
              <div className="grid grid-cols-3 gap-3 w-full mt-2">
                <button
                  onClick={() => handleAgeSelect("AGE_3_5")}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-[#FF5722] hover:bg-gradient-to-b hover:from-white hover:to-orange-50 transition-all text-center transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Baby className="text-[#FF5722]" size={26} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    3 - 5 tuổi
                  </span>
                </button>
                <button
                  onClick={() => handleAgeSelect("AGE_6_8")}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-[#2196F3] hover:bg-gradient-to-b hover:from-white hover:to-blue-50 transition-all text-center transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smile className="text-[#2196F3]" size={26} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    6 - 8 tuổi
                  </span>
                </button>
                <button
                  onClick={() => handleAgeSelect("AGE_9_12")}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-[#4CAF50] hover:bg-gradient-to-b hover:from-white hover:to-green-50 transition-all text-center transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap className="text-[#4CAF50]" size={26} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    9 - 12+ tuổi
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CHỌN KỸ NĂNG */}
          {step === "SKILL" && (
            <motion.div
              key="step-skill"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <h3 className="text-sm font-bold text-neutral-700 bg-white/80 px-4 py-1 rounded-full shadow-sm border border-neutral-100">
                Kỹ năng ưu tiên?
              </h3>
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button
                  onClick={() => handleSkillSelect("LOGIC")}
                  className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-indigo-400 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50 transition-all transform hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Puzzle className="text-indigo-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Tư duy Logic
                  </span>
                </button>
                <button
                  onClick={() => handleSkillSelect("LANGUAGE")}
                  className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-pink-400 hover:bg-gradient-to-br hover:from-white hover:to-pink-50 transition-all transform hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Languages className="text-pink-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Ngoại ngữ
                  </span>
                </button>
                <button
                  onClick={() => handleSkillSelect("MOTOR_SKILLS")}
                  className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50 transition-all transform hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="text-emerald-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Vận động
                  </span>
                </button>
                <button
                  onClick={() => handleSkillSelect("EQ")}
                  className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:border-rose-400 hover:bg-gradient-to-br hover:from-white hover:to-rose-50 transition-all transform hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="text-rose-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Cảm xúc (EQ)
                  </span>
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="mt-2 text-neutral-400 hover:text-neutral-800 text-xs hover:bg-white/50 rounded-full"
              >
                Quay lại
              </Button>
            </motion.div>
          )}

          {/* STEP 3: KẾT QUẢ GỢI Ý */}
          {step === "RESULT" && (
            <motion.div
              key="step-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-neutral-800">
                  Gợi ý dành cho bé
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="rounded-full gap-1 text-[10px] h-6 px-2 text-neutral-500 hover:text-neutral-800"
                >
                  <RefreshCcw size={12} /> Làm lại
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF5722]"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.length > 0 ? (
                    results.map((product) => (
                      <Link
                        href={`/shop/${product.slug}`}
                        key={product.id}
                        className="group flex gap-3 p-3 rounded-xl border border-neutral-100 bg-white hover:bg-orange-50/50 shadow-sm hover:shadow-md transition-all cursor-pointer items-center"
                      >
                        <div className="w-16 h-16 bg-neutral-100 rounded-lg relative overflow-hidden shrink-0 border border-neutral-100">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-between py-1 w-full min-w-0">
                          <h4 className="font-bold text-neutral-800 truncate text-xs group-hover:text-[#FF5722] transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#FF5722] font-black text-sm">
                              {product.price.toLocaleString("vi-VN")}đ
                            </span>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-[10px] font-bold rounded-full bg-neutral-900 hover:bg-[#FF5722] text-white shadow-sm transition-colors"
                            >
                              Xem
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-neutral-500">
                        Chưa tìm thấy quà phù hợp.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reset}
                        className="mt-3 rounded-full text-xs h-8"
                      >
                        Thử lại
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
