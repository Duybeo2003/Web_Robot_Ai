export const RETURN_WINDOW_DAYS = 7;
export const PAYMENT_RESERVATION_HOURS = 24;
export const VNPAY_RESERVATION_MINUTES = 30;
export const GUEST_ORDER_ACCESS_HOURS = 24;
export const POLICY_EFFECTIVE_DATE = "08/09/2026";
export const POLICY_VERSION = "2026-09-08";

// Marketing/lifecycle cron cadences — how long to wait before nudging a
// customer, not customer-facing legal terms like the constants above.
export const ABANDONED_CART_HOURS = 24;
export const REVIEW_REQUEST_DELAY_DAYS = 7;

function optionalHttpsUrl(value: string | undefined) {
  if (!value?.trim()) return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export function getBusinessIdentity() {
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || "0385.333.111";
  const zaloPhone = supportPhone.replace(/[^\d+]/g, "").replace(/^\+84/, "0");
  return {
    legalName:
      process.env.LEGAL_COMPANY_NAME?.trim() ||
      "CÔNG TY TNHH CÔNG NGHỆ GIÁO DỤC ROBOEQ",
    taxCode: process.env.LEGAL_TAX_CODE?.trim() || "",
    registrationNumber: process.env.LEGAL_REGISTRATION_NUMBER?.trim() || "",
    address:
      process.env.LEGAL_ADDRESS?.trim() ||
      "Yên Việt, Đông Cứu, Bắc Ninh, Việt Nam",
    supportPhone,
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || "",
    socialLinks: {
      facebook: optionalHttpsUrl(process.env.SOCIAL_FACEBOOK_URL),
      shopee: optionalHttpsUrl(process.env.SOCIAL_SHOPEE_URL),
      tiktok: optionalHttpsUrl(process.env.SOCIAL_TIKTOK_URL),
      zalo:
        optionalHttpsUrl(process.env.SOCIAL_ZALO_URL) ||
        (zaloPhone.length >= 9 ? `https://zalo.me/${zaloPhone}` : ""),
    },
  };
}
