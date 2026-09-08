import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createGuestOrderToken } from "@/lib/order-access";
import { prisma } from "@/lib/prisma";
import { verifyVnPayReturn } from "@/lib/vnpay";
import { settleVnPayPayment } from "@/lib/payments/vnpay-settlement";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type ReturnOrder = {
  id: string;
  idempotencyKey: string | null;
  guestAccessTokenHash: string | null;
};

function guestTokenFor(order: ReturnOrder) {
  return order.guestAccessTokenHash && order.idempotencyKey
    ? createGuestOrderToken(order.idempotencyKey)
    : undefined;
}

function errorRedirect(request: Request, message: string, order?: ReturnOrder) {
  const url = new URL("/checkout/error", request.url);
  url.searchParams.set("msg", message);
  if (order) {
    url.searchParams.set("orderId", order.id);
    const token = guestTokenFor(order);
    if (token) url.searchParams.set("token", token);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  if (!params.vnp_SecureHash || !verifyVnPayReturn(params)) {
    return errorRedirect(request, "Chữ ký thanh toán không hợp lệ.");
  }

  try {
    const payment = await prisma.paymentTransaction.findFirst({
      where: {
        provider: "VNPAY",
        OR: [{ id: params.vnp_TxnRef }, { orderId: params.vnp_TxnRef }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        order: {
          select: { id: true, idempotencyKey: true, guestAccessTokenHash: true },
        },
      },
    });
    if (!payment) return errorRedirect(request, "Không tìm thấy giao dịch thanh toán.");
    const order = payment.order;

    const isSuccessful =
      params.vnp_ResponseCode === "00" &&
      params.vnp_TransactionStatus === "00";
    const settlement = await settleVnPayPayment(params);

    if (!isSuccessful && settlement !== "already-confirmed") {
      return errorRedirect(
        request,
        `Thanh toán thất bại hoặc đã bị hủy (mã ${params.vnp_ResponseCode || "không xác định"}).`,
        order,
      );
    }
    if (settlement === "amount-mismatch") {
      return errorRedirect(request, "Số tiền VNPay trả về không khớp với đơn hàng.", order);
    }
    if (settlement === "order-unavailable") {
      return errorRedirect(request, "Đơn hàng đã hết hiệu lực trước khi thanh toán hoàn tất.", order);
    }
    if (settlement === "captured-after-cancellation") {
      return errorRedirect(
        request,
        "Khoản thanh toán đến sau khi đơn đã hết hiệu lực. RoboEQ đã ghi nhận và sẽ liên hệ để hoàn tiền.",
        order,
      );
    }
    if (settlement === "not-found" || settlement === "failed") {
      return errorRedirect(request, "Không thể xác nhận giao dịch VNPay.", order);
    }

    revalidatePath("/profile/orders");
    revalidatePath("/admin/orders");
    const successUrl = new URL(`/checkout/success/${order.id}`, request.url);
    const token = guestTokenFor(order);
    if (token) successUrl.searchParams.set("token", token);
    return NextResponse.redirect(successUrl);
  } catch (error) {
    logger.error("vnpay.return_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return errorRedirect(request, "Không thể xác nhận kết quả thanh toán.");
  }
}
