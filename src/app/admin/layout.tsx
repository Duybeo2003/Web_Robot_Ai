import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { PrismaClient } from "@prisma/client";
import Breadcrumbs from "@/components/admin/breadcrumbs";

const prisma = new PrismaClient();

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Verify role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-h-screen bg-[#F8F9FA]">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm z-10 sticky top-0">
          <SidebarTrigger className="text-[#FF5722]" />
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span className="text-neutral-400">Admin</span>
            <span className="text-neutral-300">/</span>
            <span className="text-[#0066FF]">Bảng điều khiển</span>
          </div>
        </header>
        {/* Breadcrumb navigation */}
        <Breadcrumbs />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
