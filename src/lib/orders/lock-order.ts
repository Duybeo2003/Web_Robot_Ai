import "server-only";

import { Prisma } from "@prisma/client";

export async function lockOrderRow(tx: Prisma.TransactionClient, orderId: string) {
  await tx.$queryRaw(
    Prisma.sql`SELECT \`id\` FROM \`Order\` WHERE \`id\` = ${orderId} FOR UPDATE`,
  );
}
