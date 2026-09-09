import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { verifyActiveGuestOrderToken } from "@/lib/order-access";
import { prisma } from "@/lib/prisma";
import { ArrowRight, CheckCircle2, Clock3, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBusinessIdentity,
  PAYMENT_RESERVATION_HOURS,
} from "@/lib/commerce-policy";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ id }, { token }, session] = await Promise.all([params, searchParams, auth()]);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { title: true } } } },
      paymentTransactions: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) notFound();

  const canView = session?.user?.id
    ? order.userId === session.user.id
    : Boolean(
        token &&
          order.guestAccessTokenHash &&
          verifyActiveGuestOrderToken(
            token,
            order.guestAccessTokenHash,
            order.guestAccessExpiresAt,
          ),
      );
  if (!canView) notFound();

  const pendingPayment = order.paymentTransactions[0];
  const paymentNow = Number(pendingPayment?.amount ?? order.amountDue);
  const requiresPrepayment = Boolean(
    pendingPayment && pendingPayment.provider !== "COD" && Number(order.amountDue) > 0,
  );
  const methodLabel = {
    COD: "Thanh toán khi nhận hàng",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    VNPAY: "Thanh toán qua VNPay",
  }[order.paymentMethod];

  const bankId = process.env.BANK_ID || "";
  const bankAccountNo = process.env.BANK_ACCOUNT_NO || "";
  const bankAccountName = process.env.BANK_ACCOUNT_NAME || "";
  const bankConfigured = Boolean(bankId && bankAccountNo && bankAccountName);
  const business = getBusinessIdentity();
  const qrUrl = bankConfigured
    ? `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(bankAccountNo)}-compact2.png?amount=${encodeURIComponent(paymentNow)}&addInfo=${encodeURIComponent(`RoboEQ ${order.id.toUpperCase()}`)}&accountName=${encodeURIComponent(bankAccountName)}`
    : "";

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-green-500/10">
        <div className="h-2 bg-gradient-to-r from-green-500 to-[#FF5722]" />
        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
            {requiresPrepayment ? (
              <Clock3 className="size-11 text-amber-600" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-11 text-green-600" aria-hidden="true" />
            )}
          </div>
          <h1 className="mb-3 text-3xl font-black text-[#FF5722]">Đặt hàng thành công</h1>
          <p className="mx-auto mb-8 max-w-lg text-neutral-600">
            {requiresPrepayment
              ? "Đơn hàng đã được tạo và đang chờ xác nhận thanh toán."
              : "Cảm ơn bạn đã mua sắm tại RoboEQ. Chúng tôi sẽ sớm xử lý đơn hàng."}
          </p>

          <dl className="mb-8 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-neutral-50 px-5 text-left">
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-sm text-neutral-500">Mã đơn hàng</dt>
              <dd className="break-all text-right font-mono font-bold">{order.id.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-sm text-neutral-500">Phương thức</dt>
              <dd className="text-right font-medium">{methodLabel}</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-sm text-neutral-500">Tổng đơn hàng</dt>
              <dd className="text-right text-lg font-bold text-[#E30019]">
                {currency.format(Number(order.totalAmount))}
              </dd>
            </div>
            {Number(order.amountPaid) > 0 && (
              <div className="flex justify-between gap-4 py-4">
                <dt className="text-sm text-neutral-500">Đã thanh toán</dt>
                <dd className="text-right font-semibold text-green-700">
                  {currency.format(Number(order.amountPaid))}
                </dd>
              </div>
            )}
            {paymentNow < Number(order.totalAmount) && requiresPrepayment && (
              <div className="flex justify-between gap-4 py-4">
                <dt className="text-sm text-neutral-500">Cần thanh toán trước</dt>
                <dd className="text-right font-bold text-[#E30019]">{currency.format(paymentNow)}</dd>
              </div>
            )}
          </dl>

          {pendingPayment?.provider === "BANK_TRANSFER" && bankConfigured && (
            <section className="mb-8 rounded-xl border border-orange-200 bg-orange-50 p-5 text-left">
              <h2 className="mb-4 text-center text-lg font-bold text-orange-900">
                Chuyển khoản để xác nhận đơn hàng
              </h2>
              <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
                {/* The QR provider returns a dynamic image URL that Next Image cannot predeclare. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`Mã VietQR thanh toán đơn ${order.id}`}
                  className="mx-auto size-[220px] rounded-lg border border-orange-200 bg-white object-contain p-2"
                />
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-orange-700">Ngân hàng</dt><dd className="font-semibold">{bankId.toUpperCase()}</dd></div>
                  <div><dt className="text-orange-700">Chủ tài khoản</dt><dd className="font-semibold">{bankAccountName}</dd></div>
                  <div><dt className="text-orange-700">Số tài khoản</dt><dd className="font-mono text-lg font-bold">{bankAccountNo}</dd></div>
                  <div><dt className="text-orange-700">Số tiền</dt><dd className="text-lg font-bold text-[#E30019]">{currency.format(paymentNow)}</dd></div>
                  <div><dt className="text-orange-700">Nội dung</dt><dd className="break-all rounded bg-white p-2 font-mono font-bold">RoboEQ {order.id.toUpperCase()}</dd></div>
                </dl>
              </div>
              <p className="mt-4 text-xs text-orange-800">
                Tồn kho được giữ trong {PAYMENT_RESERVATION_HOURS} giờ. Đơn sẽ tự hủy nếu chưa được xác nhận thanh toán trong thời hạn này.
              </p>
            </section>
          )}

          {pendingPayment?.provider === "BANK_TRANSFER" && !bankConfigured && (
            <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-left text-amber-900">
              <h2 className="font-bold">Kênh chuyển khoản đang tạm gián đoạn</h2>
              <p className="mt-1 text-sm">
                Không chuyển tiền đến tài khoản cũ hoặc tài khoản nhận từ nguồn khác. Vui lòng liên hệ
                {" "}<strong>{business.supportPhone}</strong>
                {business.supportEmail ? ` hoặc ${business.supportEmail}` : ""} và cung cấp mã đơn để được hỗ trợ.
              </p>
            </section>
          )}

          {pendingPayment?.provider === "VNPAY" && (
            <section className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
              <h2 className="font-bold text-blue-900">Đơn hàng đang chờ thanh toán VNPay</h2>
              <p className="mt-1 text-sm text-blue-800">Số tiền cần thanh toán: {currency.format(paymentNow)}</p>
              <Link
                href={`/api/vnpay/create_url?orderId=${encodeURIComponent(order.id)}${token ? `&token=${encodeURIComponent(token)}` : ""}`}
              >
                <Button className="mt-4 bg-blue-700 text-white hover:bg-blue-800">Tiếp tục thanh toán VNPay</Button>
              </Link>
            </section>
          )}

          {pendingPayment?.provider === "COD" && Number(order.amountPaid) > 0 && (
            <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-left text-amber-900">
              <h2 className="font-bold">Phần còn lại thanh toán khi nhận hàng</h2>
              <p className="mt-1 text-sm">
                RoboEQ đã ghi nhận tiền cọc. Số tiền còn lại là <strong>{currency.format(paymentNow)}</strong>.
              </p>
            </section>
          )}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={session?.user?.id ? "/profile/orders" : "/?login=true"}>
              <Button variant="outline" className="h-12 w-full px-7">
                <Package className="size-4" aria-hidden="true" />
                {session?.user?.id ? "Xem đơn hàng" : "Đăng nhập để theo dõi"}
              </Button>
            </Link>
            <Link href="/shop">
              <Button className="h-12 w-full bg-[#FF5722] px-7 text-white hover:bg-[#E64A19]">
                Tiếp tục mua sắm <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
