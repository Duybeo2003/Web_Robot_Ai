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
              CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ SMART HOME
              <br />
              Mã số doanh nghiệp: 2301229943
              <br />
              Cấp ngày 4/1/2023
            </p>
            <ul className="text-sm text-neutral-300 space-y-2 mt-4">
              <li><strong className="text-white">CN1:</strong> Số 28 Lý Thái Tổ, Phường Ninh Xá, TP Bắc Ninh</li>
              <li><strong className="text-white">Hotline:</strong> 0383.565.888</li>
            </ul>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary transition-colors">f</Link>
              <Link href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary transition-colors">in</Link>
              <Link href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary transition-colors">yt</Link>
            </div>
          </div>

          {/* Column 2: About Us */}
          <div>
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider">Về chúng tôi</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="/about" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Giới thiệu</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Liên hệ</Link></li>
              <li><Link href="/news" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Tin tức</Link></li>
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
              <li><Link href="/policy/privacy" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách bảo mật thông tin</Link></li>
              <li><Link href="/policy/payment" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách thanh toán</Link></li>
              <li><Link href="/policy/shipping" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách vận chuyển</Link></li>
              <li><Link href="/policy/warranty" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách bảo hành</Link></li>
              <li><Link href="/policy/return" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-xs">›</span> Chính sách đổi trả</Link></li>
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
