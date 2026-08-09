import { getActiveEvents } from "@/actions/event";
import EventsClientPage from "./client-page";

export default async function EventsPage() {
  const events = await getActiveEvents();

  return <EventsClientPage events={events} />;
}







export const revalidate = 1800; // ISR: cache 30 phút

