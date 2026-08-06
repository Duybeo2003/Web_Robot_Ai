import { getAdminDeliveries } from "@/actions/admin-delivery";
import AdminDeliveriesClientPage from "./client-page";

export const metadata = {
  title: "Quản lý Giao hàng",
};

export default async function AdminDeliveriesPage() {
  const deliveries = await getAdminDeliveries();
  
  return <AdminDeliveriesClientPage deliveries={deliveries} />;
}
