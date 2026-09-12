export const dynamic = "force-dynamic";
import { getAdminEventById } from "@/actions/admin-event";
import { notFound } from "next/navigation";
import EventConfigClientPage from "./client-page";
import { prisma } from "@/lib/prisma";

export default async function AdminEventConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const event = await getAdminEventById(resolvedParams.id);

  if (!event) {
    notFound();
  }

  // Also fetch simple product list so admin can assign product to prize
  const products = await prisma.product.findMany({
    where: { deletedAt: null, supplyType: { not: "AFFILIATE_SELL" } },
    select: { id: true, title: true, price: true },
    orderBy: { createdAt: 'desc' }
  });

  const serializedProducts = products.map(p => ({
    id: p.id,
    title: p.title,
    price: Number(p.price)
  }));

  const serializedEvent = JSON.parse(JSON.stringify(event));

  return <EventConfigClientPage event={serializedEvent} products={serializedProducts} />;
}
