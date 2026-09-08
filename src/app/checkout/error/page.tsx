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
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center min-h-[60vh] justify-center">
      <XCircle className="w-20 h-20 text-red-500 mb-6" />
      <h1 className="text-3xl font-bold mb-4 font-heading text-red-600">
        Thanh toán không thành công
      </h1>
      <p className="text-neutral-600 mb-8 max-w-md">{errorMsg}</p>

      <div className="flex gap-4">
        <Link href="/profile/orders">
          <Button variant="outline" className="h-12 px-6">
            Xem đơn hàng
          </Button>
        </Link>
        <Link href={retryUrl}>
          <Button className="h-12 px-6 bg-[#FF5722] hover:bg-[#E64A19] text-white">
            Thử thanh toán lại
          </Button>
        </Link>
      </div>
    </div>
  );
}
