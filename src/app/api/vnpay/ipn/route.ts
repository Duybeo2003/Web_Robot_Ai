import { NextResponse } from "next/server";
import { verifyVnPayReturn } from "@/lib/vnpay";
import { settleVnPayPayment } from "@/lib/payments/vnpay-settlement";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());

  if (!verifyVnPayReturn(params)) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid checksum" });
  }

  try {
    const result = await settleVnPayPayment(params);
    if (result === "not-found") {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" });
    }
    if (result === "amount-mismatch") {
      return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
    }
    if (result === "order-unavailable") {
      return NextResponse.json({ RspCode: "99", Message: "Order unavailable" });
    }
    if (result === "already-confirmed") {
      return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
    }

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("[VNPAY_IPN_ERROR]", error);
    return NextResponse.json({ RspCode: "99", Message: "Internal error" });
  }
}
