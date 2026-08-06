"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

export function ShopSidebarFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") || "";
  const currentType = searchParams.get("type") || "";
  const currentSkill = searchParams.get("skill") || "";

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const minAgeParam = searchParams.get("minAge");
  const maxAgeParam = searchParams.get("maxAge");

  const initialPriceRange = [
    minPriceParam ? parseInt(minPriceParam) : 0,
    maxPriceParam ? parseInt(maxPriceParam) : 10000000,
  ];
  
  const initialAgeRange = [
    minAgeParam ? parseInt(minAgeParam) : 3,
    maxAgeParam ? parseInt(maxAgeParam) : 18,
  ];

  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [ageRange, setAgeRange] = useState(initialAgeRange);

  // Debounced push to router
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      let changed = false;

      if (priceRange[0] !== initialPriceRange[0]) {
        if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
        else params.delete("minPrice");
        changed = true;
      }
      
      if (priceRange[1] !== initialPriceRange[1]) {
        if (priceRange[1] < 10000000) params.set("maxPrice", priceRange[1].toString());
        else params.delete("maxPrice");
        changed = true;
      }
      
      if (ageRange[0] !== initialAgeRange[0]) {
        if (ageRange[0] > 3) params.set("minAge", ageRange[0].toString());
        else params.delete("minAge");
        changed = true;
      }
      
      if (ageRange[1] !== initialAgeRange[1]) {
        if (ageRange[1] < 18) params.set("maxAge", ageRange[1].toString());
        else params.delete("maxAge");
        changed = true;
      }

      const newUrl = `${pathname}?${params.toString()}`;
      if (changed && newUrl !== `${pathname}?${searchParams.toString()}`) {
         router.push(newUrl, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, ageRange]); // Removed searchParams to avoid infinite loop

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const categories = [
    { label: "Tất cả sản phẩm", value: "" },
    { label: "Robot Giáo Dục", value: "ROBOT_STEM" },
    { label: "Đồ Chơi Logic", value: "DO_CHOI_LOGIC" },
    { label: "Combo Tiết Kiệm", value: "COMBO" },
  ];

  const skills = [
    { label: "Tất cả kỹ năng", value: "" },
    { label: "Tư duy Logic", value: "LOGIC" },
    { label: "Phát triển EQ", value: "EQ" },
    { label: "Ngoại ngữ", value: "LANGUAGE" },
    { label: "Toán học & Lập trình", value: "MATH_CODING" },
  ];

  return (
    <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
      <h2 className="font-heading font-bold text-lg mb-4 text-foreground uppercase border-b border-neutral-100 pb-3">
        Tìm kiếm
      </h2>
      <form action="/shop" method="GET" className="relative mb-6">
        <input
          type="text"
          name="q"
          defaultValue={currentQ}
          placeholder="Nhập tên sản phẩm..."
          className="w-full h-10 pl-10 pr-4 text-sm border border-neutral-200 rounded-sm focus:outline-none focus:border-[#FF5722]"
        />
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
        {currentType && <input type="hidden" name="type" value={currentType} />}
      </form>

      <Accordion className="w-full">
        <AccordionItem value="categories" className="border-b-0">
          <AccordionTrigger className="font-heading font-bold text-lg text-foreground uppercase hover:no-underline py-3">
            Danh mục
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col space-y-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => updateParam("type", cat.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors text-left ${
                    currentType === cat.value
                      ? "bg-[#FF5722]/10 text-[#FF5722]"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="border-b-0 mt-4">
          <AccordionTrigger className="font-heading font-bold text-lg text-foreground uppercase hover:no-underline py-3">
            Mức giá
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-2 pt-4 pb-2 space-y-6">
              <Slider
                value={priceRange}
                min={0}
                max={10000000}
                step={50000}
                onValueChange={(val) => setPriceRange(val as number[])}
                className="mt-2"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="border border-neutral-200 rounded-sm px-3 py-1.5 text-xs font-medium w-24 text-center">
                  {priceRange[0].toLocaleString("vi-VN")}đ
                </div>
                <span className="text-neutral-400">-</span>
                <div className="border border-neutral-200 rounded-sm px-3 py-1.5 text-xs font-medium w-24 text-center">
                  {priceRange[1].toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="age" className="border-b-0 mt-4">
          <AccordionTrigger className="font-heading font-bold text-lg text-foreground uppercase hover:no-underline py-3">
            Độ tuổi
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-2 pt-4 pb-2 space-y-6">
              <Slider
                value={ageRange}
                min={3}
                max={18}
                step={1}
                onValueChange={(val) => setAgeRange(val as number[])}
                className="mt-2"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="border border-neutral-200 rounded-sm px-3 py-1.5 text-xs font-medium w-24 text-center">
                  {ageRange[0]} tuổi
                </div>
                <span className="text-neutral-400">-</span>
                <div className="border border-neutral-200 rounded-sm px-3 py-1.5 text-xs font-medium w-24 text-center">
                  {ageRange[1] === 18 ? "18+ tuổi" : `${ageRange[1]} tuổi`}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills" className="border-b-0 mt-4">
          <AccordionTrigger className="font-heading font-bold text-lg text-foreground uppercase hover:no-underline py-3">
            Kỹ năng
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col space-y-2 mt-2">
              {skills.map((skill) => (
                <button
                  key={skill.value}
                  onClick={() => updateParam("skill", skill.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors text-left ${
                    currentSkill === skill.value
                      ? "bg-[#FF5722]/10 text-[#FF5722]"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {skill.label}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
