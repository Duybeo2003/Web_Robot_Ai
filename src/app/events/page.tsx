import { getActiveEvents } from "@/actions/event";
import EventsClientPage from "./client-page";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getActiveEvents();

  return <EventsClientPage events={events} />;
}
