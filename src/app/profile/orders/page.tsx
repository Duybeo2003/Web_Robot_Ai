import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RETURN_WINDOW_DAYS } from "@/lib/commerce-policy";
import { CancelOrderButton } from "./components/cancel-order-button";
import { RmaButton } from "./components/rma-button";
import { ReorderButton } from "./components/reorder-button";
import { ReviewButton } from "./components/review-button";
import { CheckCircle, Clock, Package, RotateCcw, Truck, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const paymentLabels = {
  UNPAID: "Chưa thanh toán",
  PARTIALLY_PAID: "Đã thanh toán một phần",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
} as const;

const returnLabels = {
  PENDING: "RMA đang chờ xử lý",
  APPROVED: "RMA đã được duyệt",
  REJECTED: "RMA bị từ chối",
  COMPLETED: "RMA đã hoàn tất",
} as const;

function formatVariantAttributes(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return "";
  return Object.values(attributes)
    .filter((value): value is string | number =>
      typeof value === "string" || typeof value === "number",
    )
    .join(" - ");
}

const PAGE_SIZE = 10;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { page: rawPage } = await searchParams;
  const currentPage = Math.max(1, parseInt(rawPage || "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [rawOrders, totalCount, databaseClock] = await Promise.all([
    prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      amountPaid: true,
      amountDue: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      logisticsProvider: true,
      trackingCode: true,
      returnRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, createdAt: true },
      },
      items: {
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          priceAtPurchase: true,
          product: { select: { title: true, slug: true, imageUrl: true } },
          variant: { select: { attributes: true } },
        },
      },
    },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.$queryRaw<Array<{ currentTime: Date }>>`
      SELECT CURRENT_TIMESTAMP(3) AS currentTime
    `,
  ]);
  const currentTime = databaseClock[0].currentTime.getTime();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const orders = rawOrders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    amountPaid: Number(order.amountPaid),
    amountDue: Number(order.amountDue),
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
    })),
  }));

  const getStatusIcon = (status: (typeof orders)[number]["status"]) => {
    switch (status) {
      case "PENDING": return <Clock className="size-5 text-amber-500" />;
      case "PROCESSING": return <Package className="size-5 text-blue-500" />;
      case "SHIPPED": return <Truck className="size-5 text-purple-500" />;
      case "COMPLETED": return <CheckCircle className="size-5 text-green-500" />;
      case "CANCELLED": return <XCircle className="size-5 text-red-500" />;
      case "RETURNED": return <RotateCcw className="size-5 text-orange-500" />;
    }
  };

  const getStatusText = (status: (typeof orders)[number]["status"]) => ({
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang chuẩn bị hàng",
    SHIPPED: "Đang giao hàng",
    COMPLETED: "Đã giao thành công",
    CANCELLED: "Đã hủy",
    RETURNED: "Đã trả hàng",
  })[status];

  const renderTimeline = (status: (typeof orders)[number]["status"]) => {
    if (status === "CANCELLED" || status === "RETURNED") {
      const returned = status === "RETURNED";
      return (
        <div className={`flex items-center gap-2 border-b px-4 py-3 text-sm font-medium ${returned ? "border-orange-100 bg-orange-50 text-orange-700" : "border-red-100 bg-red-50 text-red-600"}`}>
          {returned ? <RotateCcw className="size-5" /> : <XCircle className="size-5" />}
          {returned ? "Đơn hàng đã hoàn tất quy trình trả hàng." : "Đơn hàng đã bị hủy."}
        </div>
      );
    }

    const steps = [
      { key: "PENDING", label: "Chờ xử lý", icon: Clock },
      { key: "PROCESSING", label: "Đang chuẩn bị", icon: Package },
      { key: "SHIPPED", label: "Đang giao", icon: Truck },
      { key: "COMPLETED", label: "Hoàn thành", icon: CheckCircle },
    ];
    const currentIndex = steps.findIndex((step) => step.key === status);

    return (
      <div className="border-b border-neutral-100 bg-white px-4 py-6">
        <div className="relative flex justify-between">
          <div className="absolute left-[10%] right-[10%] top-4 -z-0 h-1 bg-neutral-200" />
          <div
            className="absolute left-[10%] top-4 -z-0 h-1 bg-green-500 transition-all duration-500"
            style={{ width: `${currentIndex > 0 ? (currentIndex / (steps.length - 1)) * 80 : 0}%` }}
          />
          {steps.map((step, index) => {
            const active = index <= currentIndex;
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative z-10 flex w-1/4 flex-col items-center gap-2">
                <div className={`flex size-8 items-center justify-center rounded-full transition-colors ${active ? "bg-green-500 text-white shadow-md shadow-green-500/20" : "bg-neutral-200 text-neutral-400"}`}>
                  <Icon className="size-4" />
                </div>
                <span className={`text-center text-[11px] font-semibold md:text-xs ${active ? "text-green-700" : "text-neutral-400"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="min-h-[500px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
      <div className="mb-6 border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Đơn hàng của tôi</h1>
        <p className="mt-1 text-sm text-neutral-500">Quản lý thanh toán, giao nhận, đánh giá và đổi trả.</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-neutral-100">
            <Package className="size-10 text-neutral-400" />
          </div>
          <p className="mb-2 font-medium text-neutral-500">Chưa có đơn hàng</p>
          <Link href="/shop" className="text-sm font-semibold text-[#FF5722] hover:underline">Khám phá sản phẩm</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const returnRequest = order.returnRequests[0];
            const completedAt = order.completedAt || order.updatedAt;
            const returnDeadline = new Date(
              completedAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000,
            );
            const canRequestReturn =
              order.status === "COMPLETED" &&
              !returnRequest &&
              returnDeadline.getTime() >= currentTime;

            return (
              <article key={order.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <header className="flex flex-col gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-neutral-600">
                    <span className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-bold text-foreground">
                      Mã ĐH: {order.id.slice(0, 8)}
                    </span>
                    <span>Ngày đặt: {order.createdAt.toLocaleDateString("vi-VN")}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">
                      {paymentLabels[order.paymentStatus]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    {getStatusIcon(order.status)} {getStatusText(order.status)}
                  </div>
                </header>

                {renderTimeline(order.status)}

                {(order.trackingCode || returnRequest) && (
                  <div className="space-y-1 border-b border-neutral-100 bg-blue-50/50 px-4 py-3 text-sm text-neutral-700">
                    {order.trackingCode && (
                      <p>
                        Vận đơn: <strong>{order.trackingCode}</strong>
                        {order.logisticsProvider ? ` · ${order.logisticsProvider}` : ""}
                      </p>
                    )}
                    {returnRequest && (
                      <p className="font-semibold text-orange-700">{returnLabels[returnRequest.status]}</p>
                    )}
                  </div>
                )}

                <div className="space-y-4 p-4">
                  {order.items.map((item) => {
                    const attributes = formatVariantAttributes(item.variant?.attributes);
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-white p-1">
                          {item.product.imageUrl ? (
                            <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-contain p-1" sizes="80px" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-neutral-400">Không có ảnh</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/shop/${item.product.slug}`} className="line-clamp-2 text-sm font-medium transition-colors hover:text-[#FF5722]">
                            {item.product.title}
                          </Link>
                          {attributes && <p className="mt-1 text-xs font-medium text-blue-600">{attributes}</p>}
                          <p className="mt-1 text-xs text-neutral-500">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="text-right text-sm font-bold text-[#FF5722]">{currency.format(item.priceAtPurchase)}</div>
                      </div>
                    );
                  })}
                </div>

                <footer className="flex flex-col gap-4 border-t border-neutral-200 bg-neutral-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <div className="flex items-center gap-2"><dt className="text-neutral-600">Tổng:</dt><dd className="text-xl font-bold text-[#FF5722]">{currency.format(order.totalAmount)}</dd></div>
                    {order.amountPaid > 0 && <div><dt className="inline text-neutral-500">Đã trả: </dt><dd className="inline font-semibold text-green-700">{currency.format(order.amountPaid)}</dd></div>}
                    {order.amountDue > 0 && <div><dt className="inline text-neutral-500">Còn lại: </dt><dd className="inline font-semibold text-red-600">{currency.format(order.amountDue)}</dd></div>}
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {order.status === "PENDING" && <CancelOrderButton orderId={order.id} />}
                    {canRequestReturn && <RmaButton orderId={order.id} />}
                    {order.status === "COMPLETED" && !returnRequest && !canRequestReturn && (
                      <Link href="/bao-hanh" className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                        Tra cứu bảo hành
                      </Link>
                    )}
                    {order.status === "COMPLETED" && (
                      <ReviewButton
                        orderId={order.id}
                        items={order.items.map((item) => ({ productId: item.productId, product: { title: item.product.title } }))}
                      />
                    )}
                    <ReorderButton
                      orderItems={order.items.map((item) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        priceAtPurchase: item.priceAtPurchase,
                        product: item.product,
                      }))}
                    />
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/profile/orders?page=${currentPage - 1}`}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              ← Trước
            </Link>
          )}
          <span className="text-sm text-neutral-500">
            Trang {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/profile/orders?page=${currentPage + 1}`}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Tiếp →
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
