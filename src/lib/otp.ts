import crypto from "crypto";

export function hashOtp(phoneNumber: string, code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return crypto
    .createHmac("sha256", secret)
    .update(`${phoneNumber}:${code}`)
    .digest("hex");
}
