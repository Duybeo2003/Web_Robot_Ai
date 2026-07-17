import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#1A1A1A] text-white pt-12 pb-6 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 text-primary">ROBOT THÔNG MINH</h3>
            <p className="text-sm text-neutral-300 leading-relaxed font-medium">
              CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ GTK_REVEILLE
            </p>
            <ul className="text-sm text-neutral-300 space-y-2 mt-4">
              <li><strong className="text-white">Chi nhánh:</strong> Goertek Nam Sơn - Hạp Lĩnh</li>
              <li><strong className="text-white">Hotline:</strong> 0385.333.111</li>
            </ul>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#1877F2] transition-colors text-white">
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.62l.38-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#0A66C2] transition-colors text-white">
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </Link>
              <Link href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#FF0000] transition-colors text-white">
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </Link>
              <Link href="https://zalo.me/0385333111" target="_blank" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#0068FF] transition-colors text-white">
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current">
                  <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Column 2: About Us */}
          <div>
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider">Về chúng tôi</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Giới thiệu</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Liên hệ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Tin tức</Link></li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div>
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider">Tài khoản</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="/portal/orders" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Đơn hàng</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Giỏ hàng</Link></li>
              <li><Link href="/portal" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Thông tin tài khoản</Link></li>
            </ul>
          </div>

          {/* Column 4: Policies */}
          <div>
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider">Chính sách</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách bảo mật thông tin</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách thanh toán</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách vận chuyển</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách bảo hành</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách đổi trả</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
          <p>© 2026 ROBOT THÔNG MINH. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
