"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, Menu, Cpu, Search, Phone, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
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

function CartBadge() {
  const totalItems = useCartStore((state) => state.totalItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || totalItems === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C86B5A] text-[10px] text-white font-bold animate-in zoom-in duration-300">
      {totalItems}
    </span>
  );
}

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { openModal } = useAuthModal();
  const { openCart } = useCartUI();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="w-full bg-white border-b border-border">
      {/* Top Bar - Logo, Search, Actions */}
      <div className="container mx-auto px-4 py-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-primary">
            ROBOT THÔNG MINH
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Tìm kiếm robot, kit STEM, đồ chơi logic..." 
              className="w-full h-10 pl-4 pr-10 border border-primary/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <button className="absolute right-0 top-0 h-10 w-12 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contact & Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-4 mr-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <span>0385.333.111</span>
            </div>
            <Link href="https://zalo.me/0385333111" target="_blank" className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors text-[#0068FF]">
              <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current">
                <path d="M21.4 12.86c0-3.66-3.47-6.62-7.75-6.62-4.28 0-7.75 2.96-7.75 6.62 0 3.66 3.47 6.62 7.75 6.62 1.34 0 2.61-.28 3.73-.78l3.1.91-.71-2.48c1.15-1.12 1.88-2.62 1.88-4.27z" />
              </svg>
              <span>Zalo Tư Vấn</span>
            </Link>
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex hover:text-primary"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {/* User / Login */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:text-primary h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent transition-colors" title="Tài khoản">
                <UserIcon className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || (session.user.role === "ADMIN" ? "Quản trị viên" : "Tài khoản của tôi")}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email || (session.user as any).phoneNumber || ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {session.user.role === "ADMIN" ? (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Bảng điều khiển</span>
                    </DropdownMenuItem>
                  </Link>
                ) : (
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Hồ sơ cá nhân</span>
                    </DropdownMenuItem>
                  </Link>
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
            <Button variant="ghost" size="icon" onClick={openModal} className="hover:text-primary" title="Đăng nhập">
              <UserIcon className="h-5 w-5" />
            </Button>
          )}

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative hover:text-primary" onClick={openCart} title="Giỏ hàng">
            <ShoppingCart className="h-5 w-5" />
            <CartBadge />
          </Button>

          {/* Mobile Menu Toggle */}
          <Sheet>
            <SheetTrigger className="lg:hidden flex h-10 w-10 items-center justify-center hover:text-primary">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="p-4 bg-primary text-white flex items-center gap-2">
                <Menu className="h-5 w-5" />
                <span className="font-bold">Danh mục sản phẩm</span>
              </div>
              <div className="flex flex-col py-2">
                <Link href="/shop?type=ROBOT_STEM" className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border">Robot Giáo Dục</Link>
                <Link href="/shop?type=KIT_ARDUINO" className="px-4 py-3 hover:bg-muted font-medium text-sm border-b border-border">Kit Tự Học Arduino</Link>
                <Link href="/shop?type=DO_CHOI_LOGIC" className="px-4 py-3 hover:bg-muted font-medium text-sm">Đồ Chơi Tư Duy Logic</Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom Nav - Orange Background */}
      <div className="w-full bg-primary text-primary-foreground hidden lg:block">
        <div className="container mx-auto px-4 h-12 flex items-center gap-8">
          {/* Category Dropdown */}
          <div className="relative group h-full flex items-center cursor-pointer bg-secondary px-4 min-w-[200px]">
            <Menu className="h-5 w-5 mr-2" />
            <span className="font-bold text-sm">DANH MỤC</span>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 w-full bg-white text-foreground shadow-lg border border-border hidden group-hover:flex flex-col z-50">
              <Link href="/shop?type=ROBOT_STEM" className="px-4 py-3 hover:text-primary hover:bg-muted transition-colors text-sm font-medium border-b border-border">Robot Giáo Dục</Link>
              <Link href="/shop?type=KIT_ARDUINO" className="px-4 py-3 hover:text-primary hover:bg-muted transition-colors text-sm font-medium border-b border-border">Kit Tự Học Arduino</Link>
              <Link href="/shop?type=DO_CHOI_LOGIC" className="px-4 py-3 hover:text-primary hover:bg-muted transition-colors text-sm font-medium">Đồ Chơi Tư Duy Logic</Link>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex items-center gap-6">
            <Link href="/shop?type=ROBOT_STEM" className="text-sm font-medium hover:text-white/80 transition-colors">
              Robot AI Giáo Dục
            </Link>
            <Link href="/shop?type=KIT_ARDUINO" className="text-sm font-medium hover:text-white/80 transition-colors">
              Kit Tự Học Arduino
            </Link>
            <Link href="/shop?type=DO_CHOI_LOGIC" className="text-sm font-medium hover:text-white/80 transition-colors">
              Đồ Chơi Tư Duy Logic
            </Link>
            <Link href="/huong-dan" className="text-sm font-medium hover:text-white/80 transition-colors">
              Hướng Dẫn Sử Dụng
            </Link>
            <Link href="/giao-duc" className="text-sm font-medium hover:text-white/80 transition-colors">
              Các Bài Viết Giáo Dục
            </Link>
            <Link href="/shop?sale=true" className="text-sm font-bold text-yellow-300 hover:text-yellow-100 transition-colors flex items-center gap-1">
              🔥 KHUYẾN MÃI HOT
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
