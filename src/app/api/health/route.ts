import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);
  const database = checks[0].status === "fulfilled";
  const cache = checks[1].status === "fulfilled";
  const healthy = database && cache;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { database, cache },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
