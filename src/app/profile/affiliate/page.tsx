import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Link2, DollarSign, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AffiliateLinkGenerator } from "./components/affiliate-link-generator";

export default async function AffiliateDashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  const commissions = await prisma.commission.findMany({
    where: { affiliateUserId: userId },
    include: {
      order: {
        include: { items: { include: { product: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const pendingEarnings = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Get eligible products
  const affiliateProducts = await prisma.product.findMany({
    where: { supplyType: "AFFILIATE_HOST" },
    select: { id: true, title: true, slug: true, commissionRate: true },
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tiếp thị liên kết (Affiliate)</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Giới thiệu sản phẩm và nhận hoa hồng khi có đơn hàng thành công.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-full text-white">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Hoa hồng đã nhận</p>
              <p className="text-2xl font-bold text-green-700">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalEarnings)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-full text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Hoa hồng đang chờ</p>
              <p className="text-2xl font-bold text-amber-700">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pendingEarnings)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-md border shadow-sm mt-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Tạo link giới thiệu
        </h2>
        <AffiliateLinkGenerator userId={userId} products={affiliateProducts} />
      </div>

      <div className="bg-white p-6 rounded-md border shadow-sm mt-8">
        <h2 className="text-lg font-bold mb-4">Lịch sử giới thiệu</h2>
        {commissions.length === 0 ? (
          <p className="text-neutral-500 text-sm">Chưa có đơn hàng nào phát sinh từ link của bạn.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 text-neutral-600 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Đơn hàng</th>
                  <th className="px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="px-4 py-3 font-medium text-right">Hoa hồng</th>
                  <th className="px-4 py-3 font-medium text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{c.orderId.slice(0,8)}...</td>
                    <td className="px-4 py-3">
                      {c.order.items.map((i) => (
                        <div key={i.id} className="truncate max-w-[200px]">
                          • {i.product.title}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#FF5722] text-right">
                      +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(c.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === "PAID" ? "bg-green-100 text-green-700" :
                        c.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
