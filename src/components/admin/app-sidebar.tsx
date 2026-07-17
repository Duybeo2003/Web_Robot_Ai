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
import { BarChart3, Package, ShoppingCart, Settings, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

const items = [
  {
    title: "Tổng quan",
    url: "/admin",
    icon: BarChart3,
  },
  {
    title: "Đơn hàng",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Sản phẩm",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Khách hàng",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Cài đặt",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 items-center px-4">
        <Link href="/" className="font-heading font-bold text-xl flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground">
            R
          </div>
          RoboEd Admin
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Link href="/" className="flex items-center gap-2 w-full">
              <LogOut className="h-4 w-4" />
              Thoát Admin
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => signOut()}>
            Đăng xuất
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
