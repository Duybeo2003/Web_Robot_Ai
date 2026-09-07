import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyVnPayReturn } from "@/lib/vnpay";
import { createGuestOrderToken } from "@/lib/order-access";
import { settleVnPayPayment } from "@/lib/payments/vnpay-settlement";

export const dynamic = "force-dynamic";

function errorRedirect(request: Request, message: string) {
  const url = new URL("/checkout/error", request.url);
  url.searchParams.set("msg", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  if (!params.vnp_SecureHash || !verifyVnPayReturn(params)) {
    return errorRedirect(request, "Chữ ký thanh toán không hợp lệ.");
  }

  const isSuccessful =
    params.vnp_ResponseCode === "00" &&
    (params.vnp_TransactionStatus === "00" ||
      (process.env.NODE_ENV === "development" && params.mock_status));
  if (!isSuccessful) {
    return errorRedirect(
      request,
      `Thanh toán thất bại hoặc đã bị hủy (mã ${params.vnp_ResponseCode || "không xác định"}).`,
    );
  }

  try {
    // The local mock gateway has no server-to-server IPN.
    if (process.env.NODE_ENV === "development" && params.mock_status) {
      params.vnp_TransactionStatus = "00";
      await settleVnPayPayment(params);
    }

    const order = await prisma.order.findUnique({
      where: { id: params.vnp_TxnRef },
      select: {
        id: true,
        idempotencyKey: true,
        guestAccessTokenHash: true,
      },
    });
    if (!order) return errorRedirect(request, "Không tìm thấy đơn hàng.");

    revalidatePath("/profile/orders");
    revalidatePath("/admin/orders");

    const successUrl = new URL(`/checkout/success/${order.id}`, request.url);
    if (order.guestAccessTokenHash && order.idempotencyKey) {
      successUrl.searchParams.set(
        "token",
        createGuestOrderToken(order.idempotencyKey),
      );
    }
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("[VNPAY_RETURN_ERROR]", error);
    return errorRedirect(request, "Không thể xác nhận kết quả thanh toán.");
  }
}
