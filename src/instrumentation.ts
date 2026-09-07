const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "REDIS_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "CRON_SECRET",
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
  if (missing.length > 0) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  }
}
