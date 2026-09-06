"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// EVENT CRUD

export async function getAdminEvents() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { prizes: true, histories: true }
      }
    }
  });
}

export async function getAdminEventById(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.event.findUnique({
    where: { id },
    include: {
      prizes: {
        orderBy: { probability: "asc" }
      }
    }
  });
}

export async function createEvent(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const event = await prisma.event.create({
    data: data as any,
  });

  revalidatePath("/admin/events");
  return event;
}

export async function updateEvent(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const event = await prisma.event.update({
    where: { id },
    data: data as any,
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return event;
}

export async function deleteEvent(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.event.delete({
    where: { id },
  });

  revalidatePath("/admin/events");
  return true;
}

// PRIZE CRUD

export async function createPrize(eventId: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const prize = await prisma.eventPrize.create({
    data: {
      ...data,
      eventId,
    } as any,
  });

  revalidatePath(`/admin/events/${eventId}`);
  return prize;
}

export async function updatePrize(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const prize = await prisma.eventPrize.update({
    where: { id },
    data: data as any,
  });

  revalidatePath(`/admin/events/${prize.eventId}`);
  return prize;
}

export async function deletePrize(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const prize = await prisma.eventPrize.delete({
    where: { id },
  });

  revalidatePath(`/admin/events/${prize.eventId}`);
  return true;
}
