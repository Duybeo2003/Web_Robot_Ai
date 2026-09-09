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
  "flash-sales": "Flash sale",
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
  const allCrumbs = [{ href: "/admin", label: "Tổng quan" }, ...crumbs];

  return (
    <nav
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2.5 text-sm sm:px-6"
      aria-label="Đường dẫn quản trị"
    >
      <Home className="mr-1 size-4 shrink-0 text-neutral-400" aria-hidden="true" />
      {allCrumbs.map((crumb, idx) => (
        <span key={crumb.href} className="flex shrink-0 items-center">
          {idx > 0 && <ChevronRight className="mx-1 size-4 text-neutral-300" aria-hidden="true" />}
          {idx === allCrumbs.length - 1 ? (
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
