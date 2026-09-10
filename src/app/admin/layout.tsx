export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/admin/breadcrumbs";
import { headers } from "next/headers";
import { adminLandingPage, canAccessAdminPath } from "@/lib/rbac";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, role: true },
  });
  if (!currentUser) redirect("/");

  const pathname = (await headers()).get("x-roboeq-path") || "/admin";
  if (!canAccessAdminPath(currentUser.role, pathname)) {
    redirect(adminLandingPage(currentUser.role));
  }
  const user = { ...session.user, role: currentUser.role };


  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-neutral-50">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 shadow-sm sm:px-6">
          <SidebarTrigger className="text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">Quản trị RoboEQ</p>
            <p className="hidden text-xs text-neutral-500 sm:block">Vận hành cửa hàng và chăm sóc khách hàng</p>
          </div>
        </header>
        <Breadcrumbs />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
