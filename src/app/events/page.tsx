import { getActiveEvents } from "@/actions/event";
import EventsClientPage from "./client-page";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sự kiện & Vòng quay may mắn | RoboEQ",
  description:
    "Tham gia sự kiện, quay thưởng và nhận ưu đãi độc quyền tại RoboEQ. Cập nhật các chương trình khuyến mại mới nhất.",
  openGraph: {
    title: "Sự kiện & Vòng quay may mắn | RoboEQ",
    description: "Sự kiện, quay thưởng và ưu đãi độc quyền từ RoboEQ.",
    type: "website",
    locale: "vi_VN",
    siteName: "RoboEQ",
  },
};

export default async function EventsPage() {
  const events = await getActiveEvents();

  return <EventsClientPage events={events} />;
}
