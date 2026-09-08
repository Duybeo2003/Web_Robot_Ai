export const RETURN_WINDOW_DAYS = 7;
export const PAYMENT_RESERVATION_HOURS = 24;
export const VNPAY_RESERVATION_MINUTES = 30;
export const POLICY_EFFECTIVE_DATE = "08/09/2026";
export const POLICY_VERSION = "2026-09-08";

export function getBusinessIdentity() {
  return {
    legalName:
      process.env.LEGAL_COMPANY_NAME?.trim() ||
      "CÔNG TY TNHH CÔNG NGHỆ GIÁO DỤC ROBOEQ",
    taxCode: process.env.LEGAL_TAX_CODE?.trim() || "",
    registrationNumber: process.env.LEGAL_REGISTRATION_NUMBER?.trim() || "",
    address:
      process.env.LEGAL_ADDRESS?.trim() ||
      "Yên Việt, Đông Cứu, Bắc Ninh, Việt Nam",
    supportPhone: process.env.SUPPORT_PHONE?.trim() || "0385.333.111",
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || "",
  };
}
