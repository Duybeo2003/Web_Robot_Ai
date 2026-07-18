import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User, Package, LogOut, Heart } from "lucide-react"
import Image from "next/image"

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/?login=true")
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#F5F5F5] min-h-screen">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white p-6 rounded-sm border border-neutral-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center overflow-hidden">
                {session.user.image ? (
                  <div className="relative w-full h-full">
                    <Image src={session.user.image} alt="Avatar" fill className="object-cover" sizes="48px" />
                  </div>
                ) : (
                  <User className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-foreground truncate">{session.user.name || "Khách hàng"}</p>
                <p className="text-xs text-neutral-500 truncate">{session.user.email || (session.user as any).phoneNumber}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-neutral-50 text-neutral-700 font-medium transition-colors">
                <User className="w-5 h-5 text-neutral-400" />
                Tài khoản của tôi
              </Link>
              <Link href="/profile/orders" className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-neutral-50 text-neutral-700 font-medium transition-colors">
                <Package className="w-5 h-5 text-neutral-400" />
                Đơn mua
              </Link>
              <Link href="/profile/wishlist" className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-neutral-50 text-neutral-700 font-medium transition-colors">
                <Heart className="w-5 h-5 text-neutral-400" />
                Sản phẩm yêu thích
              </Link>
              {/* Optional Logout Link - Note: Should ideally be a client component button for signOut() */}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
