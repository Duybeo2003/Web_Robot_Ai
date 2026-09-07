import { NextResponse } from "next/server";
import { createVnPayUrl } from "@/lib/vnpay";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyGuestOrderToken } from "@/lib/order-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const guestToken = searchParams.get("token");

  if (!orderId) {
    return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
  }

  // SECURITY: Fetch amount from database, NOT from client
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      totalAmount: true,
      depositAmount: true,
      amountDue: true,
      userId: true,
      paymentStatus: true,
      paymentMethod: true,
      guestAccessTokenHash: true,
      paymentTransactions: {
        where: { provider: "VNPAY" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Đơn hàng không tồn tại" },
      { status: 404 },
    );
  }

  // Verify ownership
  const ownsOrder = session?.user?.id === order.userId;
  const hasGuestAccess = Boolean(
    guestToken &&
      order.guestAccessTokenHash &&
      verifyGuestOrderToken(guestToken, order.guestAccessTokenHash),
  );
  if (!ownsOrder && !hasGuestAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (order.paymentMethod !== "VNPAY") {
    return NextResponse.json(
      { error: "Đơn hàng không sử dụng VNPay" },
      { status: 400 },
    );
  }

  // Prevent double payment
  if (order.paymentStatus === "PAID") {
    return NextResponse.json(
      { error: "Đơn hàng đã được thanh toán" },
      { status: 400 },
    );
  }

  const payment = order.paymentTransactions[0];
  if (!payment || payment.status !== "PENDING") {
    return NextResponse.json(
      { error: "Giao dịch thanh toán không hợp lệ" },
      { status: 400 },
    );
  }

  const amount = Number(payment.amount);
  const ipAddr =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const vnpayUrl = createVnPayUrl(orderId, amount, ipAddr);

  return NextResponse.redirect(vnpayUrl);
}
