import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { verifyGuestOrderToken } from "@/lib/order-access";
import { prisma } from "@/lib/prisma";
import { ArrowRight, CheckCircle2, Clock3, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const [{ id }, { token }, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { title: true } } } },
      paymentTransactions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) notFound();

  const canView = session?.user?.id
    ? order.userId === session.user.id
    : Boolean(
        token &&
          order.guestAccessTokenHash &&
          verifyGuestOrderToken(token, order.guestAccessTokenHash),
      );
  if (!canView) notFound();

  const payment = order.paymentTransactions[0];
  const paymentNow = Number(payment?.amount ?? order.totalAmount);
  const paymentPending =
    order.paymentMethod !== "COD" && payment?.status === "PENDING";
  const methodLabel = {
    COD: "Thanh toán khi nhận hàng",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    VNPAY: "Thanh toán qua VNPay",
  }[order.paymentMethod];

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-green-500/10">
        <div className="h-2 bg-gradient-to-r from-green-500 to-[#FF5722]" />
        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
            {paymentPending ? (
              <Clock3 className="size-11 text-amber-600" />
            ) : (
              <CheckCircle2 className="size-11 text-green-600" />
            )}
          </div>
          <h1 className="mb-3 text-3xl font-black text-[#FF5722]">
            Đặt hàng thành công
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-neutral-600">
            {paymentPending
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
            {paymentNow < Number(order.totalAmount) && (
              <div className="flex justify-between gap-4 py-4">
                <dt className="text-sm text-neutral-500">Cần thanh toán trước</dt>
                <dd className="text-right font-bold text-[#E30019]">
                  {currency.format(paymentNow)}
                </dd>
              </div>
            )}
          </dl>

          {order.paymentMethod === "BANK_TRANSFER" && paymentPending && (
            <section className="mb-8 rounded-xl border border-orange-200 bg-orange-50 p-5 text-left">
              <h2 className="mb-4 text-center text-lg font-bold text-orange-900">
                Chuyển khoản để xác nhận đơn hàng
              </h2>
              <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/vcb-1058744697-compact2.png?amount=${paymentNow}&addInfo=RoboEQ%20${order.id.toUpperCase()}&accountName=NGUYEN%20QUOC%20DUY`}
                  alt={`Mã VietQR thanh toán đơn ${order.id}`}
                  className="mx-auto size-[220px] rounded-lg border border-orange-200 bg-white object-contain p-2"
                />
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-orange-700">Ngân hàng</dt><dd className="font-semibold">Vietcombank (VCB)</dd></div>
                  <div><dt className="text-orange-700">Chủ tài khoản</dt><dd className="font-semibold">NGUYEN QUOC DUY</dd></div>
                  <div><dt className="text-orange-700">Số tài khoản</dt><dd className="font-mono text-lg font-bold">1058744697</dd></div>
                  <div><dt className="text-orange-700">Số tiền</dt><dd className="text-lg font-bold text-[#E30019]">{currency.format(paymentNow)}</dd></div>
                  <div><dt className="text-orange-700">Nội dung</dt><dd className="break-all rounded bg-white p-2 font-mono font-bold">RoboEQ {order.id.toUpperCase()}</dd></div>
                </dl>
              </div>
            </section>
          )}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={session?.user?.id ? "/profile/orders" : "/?login=true"}>
              <Button variant="outline" className="h-12 w-full px-7">
                <Package className="size-4" />
                {session?.user?.id ? "Xem đơn hàng" : "Đăng nhập để theo dõi"}
              </Button>
            </Link>
            <Link href="/shop">
              <Button className="h-12 w-full bg-[#FF5722] px-7 text-white hover:bg-[#E64A19]">
                Tiếp tục mua sắm <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
