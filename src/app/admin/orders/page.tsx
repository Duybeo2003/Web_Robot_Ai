import { prisma } from "@/lib/prisma";
import { OrdersTableClient } from "./components/orders-table-client";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const itemsPerPage = 20;
  const resolvedSearchParams = await searchParams;
  const requestedPage = Number.parseInt(resolvedSearchParams.page || "1", 10);
  const query = resolvedSearchParams.q?.trim().slice(0, 191) || "";
  const where: Prisma.OrderWhereInput = query
    ? {
        OR: [
          { id: { contains: query } },
          { customerName: { contains: query } },
          { receiverPhone: { contains: query } },
        ],
      }
    : {};
  const totalCount = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const currentPage = Math.min(
    totalPages,
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  );

  const orders = await prisma.order.findMany({
    where,
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      customerName: true,
      receiverPhone: true,
      shippingAddress: true,
      totalAmount: true,
      depositAmount: true,
      amountPaid: true,
      amountDue: true,
      termsVersion: true,
      termsAcceptedAt: true,
      createdAt: true,
      user: { select: { name: true, phoneNumber: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          priceAtPurchase: true,
          product: { select: { title: true, supplyType: true } },
          variant: { select: { attributes: true } },
        },
      },
      paymentTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          processedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const serializedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    depositAmount: Number(order.depositAmount),
    amountPaid: Number(order.amountPaid),
    amountDue: Number(order.amountDue),
    createdAt: order.createdAt.toISOString(),
    termsAcceptedAt: order.termsAcceptedAt?.toISOString() || null,
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
    })),
    paymentTransactions: order.paymentTransactions.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      processedAt: payment.processedAt?.toISOString() || null,
      createdAt: payment.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Đơn hàng</h2>
          <p className="text-muted-foreground">Quản lý và cập nhật trạng thái đơn hàng.</p>
        </div>
        <form className="flex w-full max-w-md gap-2" action="/admin/orders">
          <Input name="q" defaultValue={query} maxLength={191} placeholder="Mã đơn, tên hoặc số điện thoại" />
          <Button type="submit" variant="outline"><Search className="size-4" /> Tìm</Button>
        </form>
      </div>
      <OrdersTableClient
        orders={serializedOrders}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        query={query}
      />
    </div>
  );
}
