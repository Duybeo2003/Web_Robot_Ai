import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="font-bold text-2xl tracking-tighter text-gradient">
              RoboEd
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kiến tạo tương lai với robot thông minh, công nghệ giáo dục toàn diện và các sản phẩm dinh dưỡng tối ưu.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Cửa hàng</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/shop/robots" className="hover:text-primary transition-colors">Thiết bị Thông minh</Link></li>
              <li><Link href="/shop/nutrition" className="hover:text-primary transition-colors">Sản phẩm Dinh dưỡng</Link></li>
              <li><Link href="/shop/merch" className="hover:text-primary transition-colors">Phụ kiện & Quà tặng</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Hỗ trợ Khách hàng</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/portal/warranty" className="hover:text-primary transition-colors">Kiểm tra Bảo hành</Link></li>
              <li><Link href="/portal/rma" className="hover:text-primary transition-colors">Yêu cầu Đổi/Trả (RMA)</Link></li>
              <li><Link href="/manuals" className="hover:text-primary transition-colors">Sổ tay Hướng dẫn</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Chính sách</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Điều khoản Dịch vụ</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Chính sách Bảo mật</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Thông tin Giao hàng</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} RoboEd. Đã đăng ký Bản quyền.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-primary transition-colors">Facebook</Link>
            <Link href="#" className="hover:text-primary transition-colors">YouTube</Link>
            <Link href="#" className="hover:text-primary transition-colors">TikTok</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
