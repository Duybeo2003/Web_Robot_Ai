import "server-only";

import crypto from "node:crypto";
import { headers } from "next/headers";

export async function getRequestFingerprint() {
  const requestHeaders = await headers();
  const address =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown";
  return crypto.createHash("sha256").update(address).digest("hex").slice(0, 24);
}
