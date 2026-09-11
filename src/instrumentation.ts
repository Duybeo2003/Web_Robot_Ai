import { logger } from "@/lib/logger";

// These will crash the app if missing — no point running without them
const HARD_REQUIRED = [
  "DATABASE_URL",
  "REDIS_URL",
  "AUTH_SECRET",
  "AUTH_URL",
] as const;

// These produce warnings — app degrades gracefully without them
const SOFT_REQUIRED = [
  "CRON_SECRET",
  "EMAIL_API_KEY",
  "EMAIL_FROM",
  "ADMIN_EMAIL",
  "LEGAL_COMPANY_NAME",
  "LEGAL_TAX_CODE",
  "LEGAL_ADDRESS",
  "SUPPORT_PHONE",
  "SUPPORT_EMAIL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  // --- Hard failures (auth / database) ---
  const hardMissing = HARD_REQUIRED.filter((name) => !process.env[name]);
  if ((process.env.AUTH_SECRET?.length || 0) < 32) {
    hardMissing.push("AUTH_SECRET must contain at least 32 characters" as never);
  }
  if (hardMissing.length > 0) {
    throw new Error(
      `Missing critical production configuration: ${hardMissing.join(", ")}`,
    );
  }

  // --- Soft warnings (features degrade but app still runs) ---
  const softMissing = SOFT_REQUIRED.filter((name) => !process.env[name]);

  if ((process.env.CRON_SECRET?.length || 0) < 32 && process.env.CRON_SECRET) {
    softMissing.push("CRON_SECRET must contain at least 32 characters" as never);
  }

  // Partial config checks
  const vnpayPartial =
    ["VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_RETURN_URL"].some((n) => process.env[n]) &&
    ["VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_RETURN_URL"].some((n) => !process.env[n]);
  if (vnpayPartial) softMissing.push("complete VNPay configuration" as never);

  const bankPartial =
    ["BANK_ID", "BANK_ACCOUNT_NO", "BANK_ACCOUNT_NAME"].some((n) => process.env[n]) &&
    ["BANK_ID", "BANK_ACCOUNT_NO", "BANK_ACCOUNT_NAME"].some((n) => !process.env[n]);
  if (bankPartial) softMissing.push("complete bank-transfer configuration" as never);

  const aiPartial =
    ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"].some((n) => process.env[n]) &&
    ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"].some((n) => !process.env[n]);
  if (aiPartial) softMissing.push("complete OpenRouter configuration (add OPENROUTER_MODEL)" as never);

  // URL validation (warn only)
  const urlVars = ["AUTH_URL", "EMAIL_API_URL", "VNP_URL", "VNP_RETURN_URL"] as const;
  for (const name of urlVars) {
    const value = process.env[name];
    if (!value) continue;
    try {
      if (new URL(value).protocol !== "https:" && process.env.NODE_ENV === "production") {
        softMissing.push(`${name} should use HTTPS in production` as never);
      }
    } catch {
      softMissing.push(`${name} is not a valid URL` as never);
    }
  }

  if (softMissing.length > 0) {
    logger.warn("config.incomplete", {
      missing: softMissing,
      hint: "Some features (email, image upload, payments) may not work until these are configured",
    });
  }
}
