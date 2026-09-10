export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, Heart, Wallet, Gift } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/?login=true");
  }

  const navigation = [
    { href: "/profile", label: "Tài khoản", icon: User },
    { href: "/profile/orders", label: "Đơn mua", icon: Package },
    { href: "/profile/wishlist", label: "Yêu thích", icon: Heart },
    { href: "/profile/wallet", label: "Ví RoboCoin", icon: Wallet },
    { href: "/profile/inventory", label: "Túi đồ", icon: Gift },
    { href: "/profile/affiliate", label: "Tiếp thị liên kết", icon: User },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="min-w-0">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-neutral-100 pb-4 lg:mb-5 lg:pb-5">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
                {session.user.image ? (
                  <div className="relative w-full h-full">
                    <Image src={session.user.image} alt="Ảnh đại diện" fill className="object-cover" sizes="48px" />
                  </div>
                ) : (
                  <User className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="font-semibold text-foreground truncate">{session.user.name || "Khách hàng"}</p>
                <p className="truncate text-xs text-neutral-500">{session.user.email || session.user.phoneNumber}</p>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-2 lg:block lg:space-y-1" aria-label="Điều hướng tài khoản">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-primary/10 hover:text-primary lg:w-full"
                >
                  <Icon className="size-5 shrink-0 text-neutral-400" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
    </div>
  );
}
