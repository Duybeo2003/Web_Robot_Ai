import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CheckoutErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; orderId?: string; token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const errorMsg =
    resolvedParams.msg || "Có lỗi xảy ra trong quá trình thanh toán.";
  const retryUrl = resolvedParams.orderId
    ? `/api/vnpay/create_url?orderId=${encodeURIComponent(resolvedParams.orderId)}${
        resolvedParams.token ? `&token=${encodeURIComponent(resolvedParams.token)}` : ""
      }`
    : "/profile/orders";

  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-red-50">
        <XCircle className="size-11 text-red-500" />
      </div>
      <h1 className="mb-4 text-3xl font-bold text-red-600">
        Thanh toán không thành công
      </h1>
      <p className="text-neutral-600 mb-8 max-w-md">{errorMsg}</p>

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/profile/orders">
          <Button variant="outline" className="h-12 w-full px-6 sm:w-auto">
            Xem đơn hàng
          </Button>
        </Link>
        <Link href={retryUrl}>
          <Button className="h-12 w-full px-6 sm:w-auto">
            Thử thanh toán lại
          </Button>
        </Link>
      </div>
    </main>
  );
}
