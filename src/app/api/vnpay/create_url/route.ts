import crypto from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyGuestOrderToken } from "@/lib/order-access";
import { lockOrderRow } from "@/lib/orders/lock-order";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createVnPayUrl } from "@/lib/vnpay";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

class VnPayRequestError extends Error {}

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const guestToken = searchParams.get("token");
  if (!orderId) {
    return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
  }

  const accessOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, guestAccessTokenHash: true },
  });
  if (!accessOrder) {
    return NextResponse.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
  }
  const ownsOrder = session?.user?.id === accessOrder.userId;
  const hasGuestAccess = Boolean(
    guestToken &&
      accessOrder.guestAccessTokenHash &&
      verifyGuestOrderToken(guestToken, accessOrder.guestAccessTokenHash),
  );
  if (!ownsOrder && !hasGuestAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(`rl:vnpay-url:${orderId}`, 10, 3_600, {
    failClosed: true,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Bạn đã yêu cầu thanh toán quá nhiều lần. Vui lòng thử lại sau." },
      { status: 429 },
    );
  }

  try {
    const payment = await prisma.$transaction(async (tx) => {
      await lockOrderRow(tx, orderId);
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          paymentTransactions: {
            where: { provider: "VNPAY" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      if (!order || order.paymentMethod !== "VNPAY") {
        throw new VnPayRequestError("Đơn hàng không sử dụng VNPay.");
      }
      if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID") {
        throw new VnPayRequestError("Đơn hàng không còn chờ thanh toán VNPay.");
      }

      const latest = order.paymentTransactions[0];
      if (!latest) throw new VnPayRequestError("Không tìm thấy giao dịch VNPay.");
      if (latest.status === "PENDING") return latest;
      if (latest.status !== "FAILED") {
        throw new VnPayRequestError("Giao dịch VNPay đã được xử lý.");
      }

      return tx.paymentTransaction.create({
        data: {
          orderId,
          provider: "VNPAY",
          status: "PENDING",
          amount: latest.amount,
          idempotencyKey: `vnpay-retry:${orderId}:${crypto.randomUUID()}`,
        },
      });
    });

    const forwardedIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const ipAddress = isIP(forwardedIp) ? forwardedIp : "127.0.0.1";
    return NextResponse.redirect(
      createVnPayUrl(payment.id, Number(payment.amount), ipAddress, orderId),
    );
  } catch (error) {
    logger.error("vnpay.create_url_failed", {
      orderId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        error:
          error instanceof VnPayRequestError
            ? error.message
            : "Không thể tạo giao dịch VNPay lúc này.",
      },
      { status: 409 },
    );
  }
}
