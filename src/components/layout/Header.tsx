"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Menu,
  Cpu,
  Search,
  Phone,
  Trophy,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthModal } from "@/store/use-auth-modal";
import { useCartUI } from "@/store/use-cart-ui";
import { useCartStore } from "@/lib/store/cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

function CartBadge() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  // Delay render until after hydration to match server (no localStorage) output
  useEffect(() => setMounted(true), []);

  if (!mounted || totalItems === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C86B5A] text-[10px] text-white font-bold animate-in zoom-in duration-300">
      {totalItems}
    </span>
  );
}

export function Header({
  supportPhone,
  zaloUrl,
}: {
  supportPhone: string;
  zaloUrl: string;
}) {
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const { openCart } = useCartUI();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const phoneHref = supportPhone.replace(/[^\d+]/g, "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/95 shadow-sm backdrop-blur-lg">
      {/* Top Bar - Logo, Search, Actions */}
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="RoboEQ - Trang chủ">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
            <Cpu className="size-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
            RoboEQ
          </span>
        </Link>

        {/* Search Bar */}
        <div className="hidden max-w-2xl flex-1 items-center md:flex">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Tìm kiếm robot, kit STEM, đồ chơi logic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-full border border-neutral-300 bg-neutral-50/70 pl-5 pr-12 text-sm outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-0 top-0 flex h-11 w-12 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Contact & Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="mr-2 hidden items-center gap-4 text-sm font-semibold xl:flex">
            <a href={`tel:${phoneHref}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <span>{supportPhone}</span>
            </a>
            {zaloUrl && <Link
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors text-[#0068FF]"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className="fill-current"
              >
                <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
              </svg>
              <span>Zalo tư vấn</span>
            </Link>}
          </div>

          {/* User / Login */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="hover:text-primary h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                title="Tài khoản"
              >
                <UserIcon className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name ||
                          (["ADMIN", "STORE_MANAGER", "EDITOR"].includes(session?.user?.role as string)
                            ? "Quản trị viên"
                            : "Tài khoản của tôi")}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email ||
                           
                          session?.user?.phoneNumber ||
                          ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {["ADMIN", "STORE_MANAGER", "EDITOR"].includes(session?.user?.role as string) ? (
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/admin" className="w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Bảng điều khiển</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/profile" className="w-full flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={openModal}
              className="hover:text-primary"
              title="Đăng nhập"
              aria-label="Đăng nhập"
            >
              <UserIcon className="h-5 w-5" />
            </Button>
          )}

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:text-primary"
            onClick={openCart}
            title="Giỏ hàng"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="h-5 w-5" />
            <CartBadge />
          </Button>

          {/* Mobile Menu Toggle */}
          <Sheet open={openMobileMenu} onOpenChange={setOpenMobileMenu}>
            <SheetTrigger aria-label="Mở menu" className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-primary xl:hidden">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="p-4 bg-primary text-white flex items-center gap-2">
                <Menu className="h-5 w-5" />
                <span className="font-bold">Khám phá RoboEQ</span>
              </div>
              <div className="p-4 border-b border-border bg-neutral-50">
                <form onSubmit={(e) => { handleSearch(e); setOpenMobileMenu(false); }} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-4 pr-10 border border-primary/30 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
                  />
                  <button type="submit" aria-label="Tìm kiếm" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
              <div className="flex flex-col py-2">
                <Link
                  href="/shop?type=ROBOT_STEM"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border"
                >
                  Robot giáo dục
                </Link>
                <Link
                  href="/shop?type=DO_CHOI_LOGIC"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border"
                >
                  Đồ chơi tư duy logic
                </Link>
                <Link
                  href="/shop?type=COMBO"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 font-bold text-sm text-red-600 border-b border-border"
                >
                  Combo tiết kiệm
                </Link>
                <Link
                  href="/huong-dan"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border"
                >
                  Hướng dẫn sử dụng
                </Link>
                <Link
                  href="/bao-hanh"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border"
                >
                  Tra cứu bảo hành
                </Link>
                <Link
                  href="/giao-duc"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border"
                >
                  Kiến thức STEM
                </Link>
                <Link
                  href="/events"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-bold text-sm text-orange-600 border-b border-border flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Sự kiện & vòng quay
                </Link>
                <Link
                  href="/shop?flashsale=true"
                  onClick={() => setOpenMobileMenu(false)}
                  className="px-4 py-3 hover:bg-muted font-bold text-sm text-[#FF5722]"
                >
                  🔥 Khuyến mại nổi bật
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom Nav - Orange Background */}
      <div className="hidden w-full bg-primary text-primary-foreground xl:block">
        <div className="container mx-auto flex h-12 items-center gap-4 px-6">
          {/* Category Dropdown */}
          <div className="group relative flex h-full min-w-[220px] cursor-pointer items-center bg-secondary px-5">
            <Menu className="h-5 w-5 mr-2" />
            <span className="text-sm font-bold">Sản phẩm giáo dục</span>

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 w-[400px] bg-white text-foreground shadow-lg border border-border hidden group-hover:grid grid-cols-2 gap-2 p-4 z-50 rounded-b-xl">
              <Link
                href="/shop?type=ROBOT_STEM"
                className="p-3 hover:bg-neutral-50 rounded-lg flex flex-col"
              >
                <h4 className="font-bold text-neutral-800">Robot giáo dục</h4>
                <p className="text-xs text-neutral-500">
                  Phát triển tư duy & EQ
                </p>
              </Link>
              <Link
                href="/shop?type=DO_CHOI_LOGIC"
                className="p-3 hover:bg-neutral-50 rounded-lg flex flex-col"
              >
                <h4 className="font-bold text-neutral-800">Đồ chơi logic</h4>
                <p className="text-xs text-neutral-500">Rèn luyện trí tuệ</p>
              </Link>
              <Link
                href="/shop?type=COMBO"
                className="col-span-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg flex flex-col border border-red-100"
              >
                <h4 className="font-bold text-red-600">Combo tiết kiệm</h4>
                <p className="text-xs text-red-500">
                  Giải pháp toàn diện - Mua nhiều giảm sâu
                </p>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-1 items-center justify-between gap-3">
            <Link
              href="/shop?type=ROBOT_STEM"
              className="text-sm font-medium hover:text-white/80 transition-colors"
            >
              Robot giáo dục
            </Link>
            <Link
              href="/shop?type=DO_CHOI_LOGIC"
              className="text-sm font-medium hover:text-white/80 transition-colors"
            >
              Đồ chơi tư duy logic
            </Link>
            <Link
              href="/giao-duc"
              className="text-sm font-medium hover:text-white/80 transition-colors"
            >
              Kiến thức STEM
            </Link>
            <Link
              href="/huong-dan"
              className="text-sm font-medium hover:text-white/80 transition-colors"
            >
              Hướng dẫn sử dụng
            </Link>
            <Link
              href="/bao-hanh"
              className="text-sm font-medium hover:text-white/80 transition-colors"
            >
              Tra cứu bảo hành
            </Link>
            <Link
              href="/events"
              className="text-sm font-bold text-orange-200 hover:text-white transition-colors flex items-center gap-1"
            >
              <Trophy className="w-4 h-4" />
              Sự kiện
            </Link>
            <Link
              href="/shop?flashsale=true"
              className="text-sm font-bold text-yellow-300 hover:text-yellow-100 transition-colors flex items-center gap-1"
            >
              ⚡ FLASH SALE
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
