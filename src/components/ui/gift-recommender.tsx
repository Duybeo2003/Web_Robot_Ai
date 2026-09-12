"use client";

import { useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleAgeSelect = (selectedAge: string) => {
    setAge(selectedAge);
    setStep("SKILL");
  };

  const handleSkillSelect = async (selectedSkill: string) => {
    setStep("RESULT");
    setLoading(true);
    const data = await getGiftRecommendations(age, selectedSkill);
    setResults(data);
    setLoading(false);
  };

  const reset = () => {
    setStep("AGE");
    setAge("");
    setResults([]);
  };

  return (
    <div data-ui="gift-recommender" className="relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/60 p-5 shadow-[0_10px_35px_rgb(15,23,42,0.08)] sm:p-6 lg:min-h-0 lg:p-5 xl:p-6">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10 mb-4 text-center">
        <h2 className="flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight text-neutral-900 xl:text-xl">
          <Smile className="text-primary" size={22} /> Trợ lý chọn quà
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tìm quà giáo dục phù hợp cho bé.
        </p>
      </div>

      <div className="relative z-10 flex min-h-[190px] flex-1 items-center">
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait">
            {/* STEP 1: CHỌN TUỔI */}
            {step === "AGE" && (
              <m.div
              key="step-age"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex w-full flex-col items-center gap-3"
            >
              <h3 className="text-sm font-semibold text-neutral-700">
                Bé nhà bạn mấy tuổi?
              </h3>
              <div className="grid w-full grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAgeSelect("AGE_3_5")}
                  className="group flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-2.5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-orange-50/50 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-50 transition-transform group-hover:scale-105">
                    <Baby className="text-primary" size={22} />
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-semibold leading-5 text-neutral-700">
                    3–5 tuổi
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAgeSelect("AGE_6_8")}
                  className="group flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-2.5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 transition-transform group-hover:scale-105">
                    <Smile className="text-[#2196F3]" size={22} />
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-semibold leading-5 text-neutral-700">
                    6–8 tuổi
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAgeSelect("AGE_9_12")}
                  className="group flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-2.5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-50 transition-transform group-hover:scale-105">
                    <GraduationCap className="text-[#4CAF50]" size={22} />
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-semibold leading-5 text-neutral-700">
                    Từ 9 tuổi
                  </span>
                </button>
              </div>
              </m.div>
            )}

            {/* STEP 2: CHỌN KỸ NĂNG */}
            {step === "SKILL" && (
              <m.div
              key="step-skill"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex w-full flex-col items-center gap-3"
            >
              <h3 className="text-sm font-semibold text-neutral-700">
                Bạn muốn bé phát triển kỹ năng nào?
              </h3>
              <div className="grid w-full grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSkillSelect("LOGIC")}
                  className="group flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Puzzle className="text-indigo-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Tư duy logic
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSkillSelect("LANGUAGE")}
                  className="group flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-400 hover:bg-pink-50/50 hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Languages className="text-pink-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Ngoại ngữ
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSkillSelect("MOTOR_SKILLS")}
                  className="group flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="text-emerald-500 shrink-0" size={22} />
                  </div>
                  <span className="font-bold text-neutral-700 text-xs">
                    Vận động
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSkillSelect("EQ")}
                  className="group flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-50/50 hover:shadow-md"
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
                className="mt-1 rounded-full text-xs text-neutral-500 hover:bg-white/70 hover:text-neutral-900"
              >
                Quay lại
              </Button>
                </m.div>
            )}

            {/* STEP 3: KẾT QUẢ GỢI Ý */}
            {step === "RESULT" && (
              <m.div
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
                  className="h-8 gap-1 rounded-full px-2.5 text-xs text-neutral-500 hover:text-neutral-800"
                >
                  <RefreshCcw size={12} /> Làm lại
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                            sizes="64px"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-between py-1 w-full min-w-0">
                          <h4 className="font-bold text-neutral-800 truncate text-xs group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-primary font-black text-sm">
                              {product.price.toLocaleString("vi-VN")}đ
                            </span>
                            <span className="inline-flex h-8 items-center rounded-full bg-neutral-900 px-3 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-primary">
                              Xem
                            </span>
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
                </m.div>
            )}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </div>
  );
}
