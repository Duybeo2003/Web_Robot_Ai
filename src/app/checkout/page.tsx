import type { Metadata } from "next";
import CheckoutClient from "./checkout-client";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Thanh toán - RoboEQ",
  description: "Xác nhận thông tin giao hàng, ưu đãi và phương thức thanh toán.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  return (
    <CheckoutClient
      customer={
        session?.user?.id
          ? {
              name: session.user.name,
              phoneNumber: session.user.phoneNumber,
              points: session.user.points,
            }
          : null
      }
      bankTransferAvailable={Boolean(
        process.env.BANK_ID &&
          process.env.BANK_ACCOUNT_NO &&
          process.env.BANK_ACCOUNT_NAME,
      )}
      vnpayAvailable={Boolean(
        process.env.VNP_TMN_CODE &&
          process.env.VNP_HASH_SECRET &&
          process.env.VNP_RETURN_URL,
      )}
    />
  );
}
