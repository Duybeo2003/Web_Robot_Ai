import Link from "next/link";
import { getBusinessIdentity } from "@/lib/commerce-policy";

const linkClass =
  "flex items-center gap-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function Footer() {
  const business = getBusinessIdentity();
  const phoneHref = business.supportPhone.replace(/[^\d+]/g, "");

  return (
    <footer className="mt-4 w-full bg-[#1A1A1A] pb-6 pt-12 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary">RoboEQ</h2>
            <p className="text-sm font-medium leading-relaxed text-neutral-300">
              {business.legalName}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              {business.taxCode && (
                <li>
                  <strong className="text-white">Mã số thuế:</strong>{" "}
                  {business.taxCode}
                </li>
              )}
              {business.registrationNumber && (
                <li>
                  <strong className="text-white">Đăng ký kinh doanh:</strong>{" "}
                  {business.registrationNumber}
                </li>
              )}
              <li>
                <strong className="text-white">Địa chỉ:</strong>{" "}
                {business.address}
              </li>
              <li>
                <strong className="text-white">Hotline:</strong>{" "}
                <a className="hover:text-primary" href={`tel:${phoneHref}`}>
                  {business.supportPhone}
                </a>
              </li>
              {business.supportEmail && (
                <li>
                  <strong className="text-white">Email:</strong>{" "}
                  <a
                    className="break-all hover:text-primary"
                    href={`mailto:${business.supportEmail}`}
                  >
                    {business.supportEmail}
                  </a>
                </li>
              )}
            </ul>
            <div className="flex gap-4 pt-2">
              <Link
                href="https://www.facebook.com/share/1PSifhd4HB/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors hover:bg-[#1877F2]"
                title="Facebook"
                aria-label="Facebook RoboEQ"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.62l.38-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link
                href="https://vn.shp.ee/jYvqVEMj"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors hover:bg-[#EE4D2D]"
                title="Shopee"
                aria-label="Gian hàng Shopee RoboEQ"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current" aria-hidden="true">
                  <path d="M19 6h-2c0-2.8-2.2-5-5-5S7 3.2 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.7 0 3 1.3 3 3H9c0-1.7 1.3-3 3-3zm7 17H5V8h14v12zm-7-8c-1.7 0-3-1.3-3-3H7c0 2.8 2.2 5 5 5s5-2.2 5-5h-2c0 1.7-1.3 3-3 3z" />
                </svg>
              </Link>
              <Link
                href={`https://zalo.me/${phoneHref.replace(/^\+84/, "0")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors hover:bg-[#0068FF]"
                title="Zalo"
                aria-label="Zalo RoboEQ"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current" aria-hidden="true">
                  <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
                </svg>
              </Link>
            </div>
          </div>

          <nav aria-label="Về RoboEQ">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Về chúng tôi</h2>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="/gioi-thieu" className={linkClass}><span aria-hidden="true">›</span> Giới thiệu</Link></li>
              <li><Link href="/lien-he" className={linkClass}><span aria-hidden="true">›</span> Liên hệ</Link></li>
              <li><Link href="/giao-duc" className={linkClass}><span aria-hidden="true">›</span> Kiến thức STEM</Link></li>
            </ul>
          </nav>

          <nav aria-label="Tài khoản khách hàng">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Tài khoản</h2>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="/profile/orders" className={linkClass}><span aria-hidden="true">›</span> Đơn hàng</Link></li>
              <li><Link href="/cart" className={linkClass}><span aria-hidden="true">›</span> Giỏ hàng</Link></li>
              <li><Link href="/profile" className={linkClass}><span aria-hidden="true">›</span> Thông tin tài khoản</Link></li>
            </ul>
          </nav>

          <nav aria-label="Điều khoản và chính sách">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Điều khoản & chính sách</h2>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><Link href="/dieu-khoan-su-dung" className={linkClass}><span aria-hidden="true">›</span> Điều khoản sử dụng</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className={linkClass}><span aria-hidden="true">›</span> Bảo mật thông tin</Link></li>
              <li><Link href="/chinh-sach-thanh-toan" className={linkClass}><span aria-hidden="true">›</span> Thanh toán</Link></li>
              <li><Link href="/chinh-sach-van-chuyen" className={linkClass}><span aria-hidden="true">›</span> Vận chuyển</Link></li>
              <li><Link href="/bao-hanh" className={linkClass}><span aria-hidden="true">›</span> Bảo hành</Link></li>
              <li><Link href="/chinh-sach-doi-tra" className={linkClass}><span aria-hidden="true">›</span> Đổi trả & hoàn tiền</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-neutral-800 pt-6 text-xs text-neutral-500 md:flex-row">
          <p>© 2026 RoboEQ. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
}
