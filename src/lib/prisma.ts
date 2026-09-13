import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma defaults the connection pool to (CPU cores * 2 + 1) — just 5
// connections on a 2-core VPS. MySQL itself comfortably handles far more
// (default max_connections is 151), and Next.js's automatic <Link>
// prefetching can burst several concurrent DB-backed page renders at once,
// exhausting a 5-connection pool and surfacing to visitors as intermittent
// 503s. Raise the floor unless the deployer has already set their own.
function databaseUrlWithPoolSize() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "10");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrlWithPoolSize() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
