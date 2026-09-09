"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SocialLinks = {
  facebook: string;
  shopee: string;
  tiktok: string;
  zalo: string;
};

export function FloatingSocialBar({ links }: { links: SocialLinks }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || !Object.values(links).some(Boolean)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-6">
      {/* Shopee */}
      {links.shopee && <Link
        href={links.shopee}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative hidden size-11 items-center justify-center rounded-full border border-white/20 bg-[#EE4D2D] text-white shadow-lg transition-transform duration-300 hover:scale-105 sm:flex md:size-12"
        title="Shopee"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current z-10 md:w-6 md:h-6">
          <path d="M19 6h-2c0-2.8-2.2-5-5-5S7 3.2 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.7 0 3 1.3 3 3H9c0-1.7 1.3-3 3-3zm7 17H5V8h14v12zm-7-8c-1.7 0-3-1.3-3-3H7c0 2.8 2.2 5 5 5s5-2.2 5-5h-2c0 1.7-1.3 3-3 3z" />
        </svg>
      </Link>}

      {/* Facebook */}
      {links.facebook && <Link
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative hidden size-11 items-center justify-center rounded-full border border-white/20 bg-[#1877F2] text-white shadow-lg transition-transform duration-300 hover:scale-105 sm:flex md:size-12"
        title="Facebook"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current z-10 md:w-6 md:h-6">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.62l.38-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </Link>}

      {/* Tiktok */}
      {links.tiktok && (
      <Link
        href={links.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative hidden size-11 items-center justify-center rounded-full border border-white/20 bg-black text-white shadow-lg transition-transform duration-300 hover:scale-105 sm:flex md:size-12"
        title="TikTok"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" className="fill-current z-10 md:w-[22px] md:h-[22px]">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      </Link>
      )}

      {/* Zalo */}
      {links.zalo && <Link
        href={links.zalo}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex size-11 items-center justify-center rounded-full border-2 border-white bg-[#0068FF] text-white shadow-lg shadow-blue-500/25 transition-transform duration-300 hover:scale-105 md:size-12"
        title="Liên hệ qua Zalo"
        aria-label="Liên hệ RoboEQ qua Zalo"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current z-10 md:w-6 md:h-6">
          <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
        </svg>
      </Link>}
    </div>
  );
}
