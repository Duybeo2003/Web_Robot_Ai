import "server-only";

import crypto from "node:crypto";

export function inventoryMovementKey(
  source: "SALE" | "CANCELLATION" | "RETURN",
  eventId: string,
  productId: string,
  variantId?: string | null,
) {
  const digest = crypto
    .createHash("sha256")
    .update(`${source}:${eventId}:${productId}:${variantId || "base"}`)
    .digest("hex");
  return `inventory:${source.toLowerCase()}:${digest}`;
}
