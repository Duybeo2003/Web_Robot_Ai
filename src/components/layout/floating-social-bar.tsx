"use client";

import Link from "next/link";
import { Phone } from "lucide-react";

export function FloatingSocialBar() {
  return (
    <div className="fixed right-4 bottom-24 z-50 flex flex-col gap-4">
      {/* Shopee */}
      <Link
        href="https://vn.shp.ee/jYvqVEMj"
        target="_blank"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#EE4D2D] text-white shadow-lg shadow-orange-500/30 hover:scale-110 transition-transform duration-300"
        title="Shopee"
      >
        <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-[#EE4D2D]"></span>
        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current z-10">
          <path d="M19 6h-2c0-2.8-2.2-5-5-5S7 3.2 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.7 0 3 1.3 3 3H9c0-1.7 1.3-3 3-3zm7 17H5V8h14v12zm-7-8c-1.7 0-3-1.3-3-3H7c0 2.8 2.2 5 5 5s5-2.2 5-5h-2c0 1.7-1.3 3-3 3z" />
        </svg>
      </Link>

      {/* Facebook */}
      <Link
        href="https://www.facebook.com/share/1PSifhd4HB/?mibextid=wwXIfr"
        target="_blank"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1877F2] text-white shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform duration-300"
        title="Facebook"
      >
        <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-[#1877F2]"></span>
        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current z-10">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.62l.38-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </Link>

      {/* Zalo */}
      <Link
        href="https://zalo.me/0385333111"
        target="_blank"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0068FF] text-white shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform duration-300"
        title="Zalo"
      >
        <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-[#0068FF]"></span>
        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current z-10">
          <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
        </svg>
      </Link>

      {/* Hotline */}
      <Link
        href="tel:0385333111"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-110 transition-transform duration-300"
        title="Hotline: 0385.333.111"
      >
        <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-red-600"></span>
        <Phone className="w-6 h-6 z-10 animate-bounce" />
      </Link>
    </div>
  );
}
