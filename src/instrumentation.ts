const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "REDIS_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
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

  const missing: string[] = REQUIRED_PRODUCTION_ENV.filter(
    (name) => !process.env[name],
  );
  for (const name of REQUIRED_PRODUCTION_ENV) {
    const value = process.env[name];
    if (value && /replace-with|example\.com/i.test(value)) {
      missing.push(`${name} still contains an example value`);
    }
  }
  const httpsVariables = [
    "AUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "EMAIL_API_URL",
    "SMS_WEBHOOK_URL",
    "VNP_URL",
    "VNP_RETURN_URL",
    "LOGISTICS_API_URL",
    "SOCIAL_FACEBOOK_URL",
    "SOCIAL_SHOPEE_URL",
    "SOCIAL_TIKTOK_URL",
    "SOCIAL_ZALO_URL",
  ] as const;
  for (const name of httpsVariables) {
    const value = process.env[name];
    if (!value) continue;
    try {
      if (new URL(value).protocol !== "https:") {
        missing.push(`${name} must use HTTPS`);
      }
    } catch {
      missing.push(`${name} must be a valid URL`);
    }
  }
  if ((process.env.AUTH_SECRET?.length || 0) < 32) {
    missing.push("AUTH_SECRET must contain at least 32 characters");
  }
  if ((process.env.CRON_SECRET?.length || 0) < 32) {
    missing.push("CRON_SECRET must contain at least 32 characters");
  }
  const vnpayPartiallyConfigured =
    ["VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_RETURN_URL"].some(
      (name) => process.env[name],
    ) &&
    ["VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_RETURN_URL"].some(
      (name) => !process.env[name],
    );
  if (vnpayPartiallyConfigured) {
    missing.push("complete VNPay configuration");
  }
  const bankPartiallyConfigured =
    ["BANK_ID", "BANK_ACCOUNT_NO", "BANK_ACCOUNT_NAME"].some(
      (name) => process.env[name],
    ) &&
    ["BANK_ID", "BANK_ACCOUNT_NO", "BANK_ACCOUNT_NAME"].some(
      (name) => !process.env[name],
    );
  if (bankPartiallyConfigured) {
    missing.push("complete bank-transfer configuration");
  }
  const aiPartiallyConfigured =
    ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"].some((name) => process.env[name]) &&
    ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"].some((name) => !process.env[name]);
  if (aiPartiallyConfigured) {
    missing.push("complete OpenRouter configuration");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  }
}
