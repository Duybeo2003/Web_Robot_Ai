"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labels: Record<string, string> = {
  admins: "Quản trị viên",
  articles: "Bài viết",
  audit: "Nhật ký kiểm toán",
  categories: "Danh mục",
  combos: "Combo",
  commissions: "Đối soát hoa hồng",
  coupons: "Mã giảm giá",
  deliveries: "Trả thưởng và giao hàng",
  events: "Sự kiện",
  "flash-sales": "Ưu đãi nhanh",
  inventory: "Kho hàng",
  orders: "Đơn hàng",
  products: "Sản phẩm",
  reports: "Báo cáo",
  returns: "Đổi trả",
  reviews: "Đánh giá",
  settings: "Cài đặt",
  support: "Yêu cầu hỗ trợ",
  users: "Khách hàng",
  wallet: "Duyệt nạp xu",
  warranties: "Bảo hành",
  new: "Tạo mới",
  "new-po": "Tạo phiếu nhập",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = parts.map((part, index) => {
    const href = `/admin/${parts.slice(0, index + 1).join("/")}`;
    const label = labels[part] || (index === parts.length - 1 ? "Chi tiết" : part);
    return { href, label };
  });
  const visibleCrumbs = crumbs.length > 0 ? crumbs : [{ href: "/admin", label: "Tổng quan" }];

  return (
    <nav
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2.5 text-sm sm:px-6"
      aria-label="Đường dẫn quản trị"
    >
      <Link
        href="/admin"
        className="mr-1 shrink-0 rounded-md text-neutral-400 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Về tổng quan"
      >
        <Home className="size-4" aria-hidden="true" />
      </Link>
      {visibleCrumbs.map((crumb, idx) => (
        <span key={crumb.href} className="flex shrink-0 items-center">
          <ChevronRight className="mx-1 size-4 text-neutral-300" aria-hidden="true" />
          {idx === visibleCrumbs.length - 1 ? (
            <span className="font-semibold text-foreground" aria-current="page">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-neutral-500 transition-colors hover:text-primary">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
