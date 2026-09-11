import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportsChart } from "./components/reports-chart";
import { CategoryRevenueChart } from "./components/category-revenue-chart";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  XCircle,
  BarChart3,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Báo cáo kinh doanh - Admin",
  description: "Báo cáo thống kê kinh doanh toàn diện",
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminReportsPage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STORE_MANAGER")
  ) {
    redirect("/");
  }

  const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // --- Run all queries in parallel ---
  const [
    revenueResult,
    revenueLastMonth,
    recentOrders,
    orderStatusCounts,
    newCustomersTotal,
    newCustomersLastMonth,
    cancelledCount,
    totalCompletedCount,
    topProducts,
    categoryRevenue,
  ] = await Promise.all([
    // Total revenue (all time)
    prisma.order.aggregate({
      where: { status: "COMPLETED", paymentStatus: { not: "REFUNDED" }, deletedAt: null },
      _sum: { amountPaid: true },
    }),

    // Revenue last 30 days
    prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        paymentStatus: { not: "REFUNDED" },
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amountPaid: true },
    }),

    // Monthly chart data (last 6 months)
    prisma.order.findMany({
      where: {
        status: "COMPLETED",
        paymentStatus: { not: "REFUNDED" },
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amountPaid: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Order count by status
    prisma.order.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    // New customers (all time)
    prisma.user.count({ where: { role: "USER", deletedAt: null } }),

    // New customers last 30 days
    prisma.user.count({
      where: { role: "USER", deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
    }),

    // Cancelled orders last 30 days
    prisma.order.count({
      where: { status: "CANCELLED", deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
    }),

    // Total completed orders last 30 days
    prisma.order.count({
      where: {
        status: { in: ["COMPLETED", "CANCELLED"] },
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),

    // Top 5 best-selling products
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: "COMPLETED", deletedAt: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),

    // Revenue by category (last 6 months)
    prisma.orderItem.findMany({
      where: {
        order: {
          status: "COMPLETED",
          paymentStatus: { not: "REFUNDED" },
          deletedAt: null,
          createdAt: { gte: sixMonthsAgo },
        },
      },
      select: {
        quantity: true,
        priceAtPurchase: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
  ]);

  // Fetch product titles for top products
  const productIds = topProducts.map((p) => p.productId);
  const productTitles = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true },
  });
  const productMap = Object.fromEntries(productTitles.map((p) => [p.id, p.title]));

  // Group chart data by month
  const groupedData: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const month = format(subMonths(new Date(), i), "MM/yyyy");
    groupedData[month] = 0;
  }
  recentOrders.forEach((order) => {
    const month = format(new Date(order.createdAt), "MM/yyyy");
    if (month in groupedData) {
      groupedData[month] += Number(order.amountPaid);
    }
  });
  const chartData = Object.entries(groupedData).map(([name, revenue]) => ({ name, revenue }));

  // Group category revenue
  const catRevenueMap: Record<string, number> = {};
  categoryRevenue.forEach((item) => {
    const cat = item.product?.category?.name || "Chưa phân loại";
    catRevenueMap[cat] = (catRevenueMap[cat] || 0) + Number(item.priceAtPurchase) * item.quantity;
  });
  const catChartData = Object.entries(catRevenueMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Metrics
  const totalRevenue = Number(revenueResult._sum.amountPaid || 0);
  const revenueThisMonth = Number(revenueLastMonth._sum.amountPaid || 0);
  const cancelRate =
    totalCompletedCount > 0
      ? ((cancelledCount / totalCompletedCount) * 100).toFixed(1)
      : "0.0";

  const orderStatusMap = Object.fromEntries(
    orderStatusCounts.map((s) => [s.status, s._count._all]),
  );

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700" },
    PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
    SHIPPED: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
    COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
    RETURNED: { label: "Đã trả hàng", color: "bg-neutral-100 text-neutral-700" },
  };

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo kinh doanh</h2>
        <p className="mt-1 text-muted-foreground">
          Tổng quan toàn diện về doanh thu, đơn hàng và khách hàng.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng doanh thu
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-600">{formatVND(totalRevenue)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Toàn thời gian (đơn hoàn thành)</p>
            <div className="mt-2 text-xs font-medium text-green-600">
              {formatVND(revenueThisMonth)} trong 30 ngày qua
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng đơn hàng
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">
              {Object.values(orderStatusMap).reduce((a, b) => a + b, 0).toLocaleString("vi-VN")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Tất cả trạng thái</p>
            <div className="mt-2 text-xs font-medium text-blue-600">
              {(orderStatusMap["PENDING"] || 0) + (orderStatusMap["PROCESSING"] || 0)} đơn đang chờ xử lý
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Khách hàng
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{newCustomersTotal.toLocaleString("vi-VN")}</div>
            <p className="mt-1 text-xs text-muted-foreground">Tổng khách hàng đăng ký</p>
            <div className="mt-2 text-xs font-medium text-purple-600">
              +{newCustomersLastMonth} mới trong 30 ngày qua
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Rate */}
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tỷ lệ hủy đơn
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${Number(cancelRate) > 10 ? "text-red-600" : "text-neutral-800"}`}>
              {cancelRate}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Trong 30 ngày qua</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {cancelledCount} hủy / {totalCompletedCount} tổng đơn kết thúc
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart (3/5) */}
        <Card className="border-neutral-200/60 shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Doanh thu theo tháng
            </CardTitle>
            <CardDescription>6 tháng gần nhất (đơn hoàn thành)</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsChart data={chartData} />
          </CardContent>
        </Card>

        {/* Category Revenue (2/5) */}
        <Card className="border-neutral-200/60 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              Doanh thu theo danh mục
            </CardTitle>
            <CardDescription>6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryRevenueChart data={catChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Breakdown */}
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              Đơn hàng theo trạng thái
            </CardTitle>
            <CardDescription>Phân bổ trạng thái toàn bộ đơn hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(STATUS_LABELS).map(([status, { label, color }]) => {
                const count = orderStatusMap[status] || 0;
                const total = Object.values(orderStatusMap).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`w-24 shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-bold ${color}`}>
                      {label}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-current transition-all duration-500"
                          style={{ width: `${pct}%`, color: color.includes("green") ? "#16a34a" : color.includes("blue") ? "#2563eb" : color.includes("amber") ? "#d97706" : color.includes("red") ? "#dc2626" : color.includes("indigo") ? "#4f46e5" : "#6b7280" }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm font-bold text-neutral-700">
                        {count.toLocaleString("vi-VN")}
                      </span>
                      <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-neutral-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top 5 sản phẩm bán chạy
            </CardTitle>
            <CardDescription>Tính theo số lượng đã bán (đơn hoàn thành)</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu bán hàng.
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((item, idx) => {
                  const title = productMap[item.productId] || item.productId;
                  const qty = item._sum.quantity || 0;
                  const maxQty = topProducts[0]._sum.quantity || 1;
                  const pct = Math.round((qty / maxQty) * 100);
                  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                  return (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="w-6 shrink-0 text-center text-lg">{medals[idx]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-800">{title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-black text-green-600">
                        {qty.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
