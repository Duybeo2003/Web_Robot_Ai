import { PrismaClient } from "@prisma/client";
import { OrdersTableClient } from "./components/orders-table-client";

const prisma = new PrismaClient();

export default async function AdminOrdersPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = props.searchParams;
  const itemsPerPage = 20;
  const currentPage = Number((await searchParams)?.page) || 1;

  const totalCount = await prisma.order.count();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const orders = await prisma.order.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      items: {
        include: { product: true, variant: true },
      },
    },
  });

  const serializedOrders = orders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
      product: {
        ...item.product,
        price: Number(item.product.price),
        originalPrice: item.product.originalPrice
          ? Number(item.product.originalPrice)
          : null,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Đơn hàng</h2>
        <p className="text-muted-foreground">
          Quản lý và cập nhật trạng thái đơn hàng.
        </p>
      </div>

      <OrdersTableClient 
        orders={serializedOrders} 
        totalCount={totalCount} 
        totalPages={totalPages} 
        currentPage={currentPage} 
      />
    </div>
  );
}
