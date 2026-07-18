"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { BarChart3, Package, ShoppingCart, Settings, Users, ArrowLeft, LogOut, Tags, Star, Ticket, ListTree } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

const overviewGroup = [
  { title: "Tổng quan", url: "/admin", icon: BarChart3 },
]

const salesGroup = [
  { title: "Đơn hàng", url: "/admin/orders", icon: ShoppingCart },
  { title: "Đánh giá", url: "/admin/reviews", icon: Star },
]

const productGroup = [
  { title: "Sản phẩm", url: "/admin/products", icon: Package },
  { title: "Danh mục", url: "/admin/categories", icon: ListTree },
]

const marketingGroup = [
  { title: "Khuyến mãi", url: "/admin/coupons", icon: Ticket },
]

const systemGroup = [
  { title: "Khách hàng", url: "/admin/users", icon: Users },
  { title: "Cài đặt", url: "/admin/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  const renderGroup = (label: string, items: typeof overviewGroup) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/") && item.url !== "/admin";
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  render={
                    <Link 
                      href={item.url} 
                      className={`flex items-center gap-2 w-full font-medium transition-all ${
                        isActive 
                          ? 'text-[#FF5722] bg-orange-50 hover:bg-orange-100 hover:text-[#FF5722]' 
                          : 'text-neutral-600 hover:text-[#FF5722] hover:bg-orange-50/50'
                      }`}
                    />
                  } 
                  isActive={isActive}
                >
                  <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#FF5722]' : 'text-neutral-500'}`} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )

  return (
    <Sidebar className="border-r border-orange-100/50 bg-white shadow-sm">
      <SidebarHeader className="flex h-16 items-center px-4 border-b border-orange-100">
        <Link href="/" className="font-heading font-bold text-xl flex items-center gap-2 text-neutral-800 hover:text-[#FF5722] transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF5722] to-[#E64A19] rounded-md flex items-center justify-center text-white shadow-md font-bold">
            R
          </div>
          RoboEd Admin
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        {renderGroup("Dữ liệu", overviewGroup)}
        <div className="px-4 py-2 opacity-50"><SidebarSeparator /></div>
        {renderGroup("Bán hàng", salesGroup)}
        <div className="px-4 py-2 opacity-50"><SidebarSeparator /></div>
        {renderGroup("Kho hàng", productGroup)}
        <div className="px-4 py-2 opacity-50"><SidebarSeparator /></div>
        {renderGroup("Tiếp thị", marketingGroup)}
        <div className="px-4 py-2 opacity-50"><SidebarSeparator /></div>
        {renderGroup("Hệ thống", systemGroup)}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-orange-100 bg-orange-50/30">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-orange-200 bg-white hover:bg-orange-100 text-orange-700 h-9 px-4 py-2 w-full gap-2 shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Về Cửa Hàng
          </Link>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
