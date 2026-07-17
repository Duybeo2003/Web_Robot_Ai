"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthModal } from "@/store/use-auth-modal";
import { useCartUI } from "@/store/use-cart-ui";
import { useCartStore } from "@/lib/store/cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const NavLinks = () => (
    <>
      <Link href="/shop" className="text-sm font-medium font-manrope text-[#2C2C2C]/80 hover:text-[#C86B5A] transition-colors relative group">
        Cửa hàng
        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#C86B5A] transition-all duration-300 group-hover:w-full"></span>
      </Link>
      <Link href="/academy" className="text-sm font-medium font-manrope text-[#2C2C2C]/80 hover:text-[#C86B5A] transition-colors relative group">
        Học viện
        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#C86B5A] transition-all duration-300 group-hover:w-full"></span>
      </Link>
      <Link href="/portal/warranty" className="text-sm font-medium font-manrope text-[#2C2C2C]/80 hover:text-[#C86B5A] transition-colors relative group">
        Bảo hành
        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#C86B5A] transition-all duration-300 group-hover:w-full"></span>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F9F8F6]/80 backdrop-blur-md border-b border-stone-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-2xl font-lora tracking-tight text-[#2C2C2C] hover:opacity-80 transition-opacity">
            RoboEd
          </Link>
          <nav className="hidden md:flex gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-sm text-[#2C2C2C] hover:bg-stone-200/50 hidden sm:flex"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {/* Cart Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-sm relative text-[#2C2C2C] hover:bg-stone-200/50" 
            title="Giỏ hàng"
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" />
            <CartBadge />
          </Button>

          {/* User Actions */}
          {session ? (
            <div className="flex items-center gap-2">
              <Link href={session.user.role === "ADMIN" ? "/admin" : "/portal"} title="Bảng điều khiển">
                <Button variant="ghost" size="icon" className="rounded-sm text-[#2C2C2C] hover:bg-stone-200/50">
                  {session.user.role === "ADMIN" ? <LayoutDashboard className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="rounded-sm font-medium font-manrope gap-2 hidden sm:flex border-stone-200 text-[#2C2C2C] hover:bg-stone-100">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </Button>
            </div>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={openModal}
              className="rounded-sm font-medium font-manrope bg-[#C86B5A] hover:bg-[#C86B5A]/90 text-white transition-colors"
            >
              Đăng nhập
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger className="md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm text-[#2C2C2C] hover:bg-stone-200/50">
                <Menu className="h-5 w-5" />
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#F9F8F6] border-stone-200 w-[280px]">
              <div className="flex flex-col gap-6 mt-8">
                <NavLinks />
                {session && (
                  <Button variant="outline" size="sm" onClick={() => signOut()} className="rounded-sm font-medium font-manrope justify-start border-stone-200 text-[#2C2C2C] hover:bg-stone-100 w-full mt-4">
                    <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
