import { getAdminEvents } from "@/actions/admin-event";
import AdminEventsClientPage from "./client-page";

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return <AdminEventsClientPage events={events} />;
}
