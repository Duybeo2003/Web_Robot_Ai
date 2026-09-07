import "server-only";

import crypto from "crypto";

function accessSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }
  return secret || "roboeq-development-only-secret";
}

export function createGuestOrderToken(idempotencyKey: string) {
  return crypto
    .createHmac("sha256", accessSecret())
    .update(`guest-order:${idempotencyKey}`)
    .digest("hex");
}

export function hashGuestOrderToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyGuestOrderToken(token: string, expectedHash: string) {
  const actual = Buffer.from(hashGuestOrderToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
