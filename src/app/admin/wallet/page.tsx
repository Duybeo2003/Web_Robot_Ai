import { getPendingTopups } from "@/actions/admin-wallet";
import AdminWalletClientPage from "./client-page";

export default async function AdminWalletPage() {
  const pendingTopups = await getPendingTopups();

  return <AdminWalletClientPage pendingTopups={pendingTopups} />;
}
