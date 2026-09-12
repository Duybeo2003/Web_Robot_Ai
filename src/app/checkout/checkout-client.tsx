"use client";

import { useCartStore } from "@/lib/store/cart";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { processCheckout } from "@/actions/checkout";
import { generateOtp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShoppingBag,
  Loader2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { validateCoupon } from "@/actions/coupon";
import Image from "next/image";
import { toast } from "sonner";

type CheckoutClientProps = {
  bankTransferAvailable: boolean;
  vnpayAvailable: boolean;
  customer: {
    name?: string | null;
    phoneNumber: string | null;
    points: number;
  } | null;
};

export default function CheckoutClient({
  bankTransferAvailable,
  vnpayAvailable,
  customer,
}: CheckoutClientProps) {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // FIX: Calculate total locally to avoid Zustand persist getter mismatch
  const calculatedTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  
  const hasPreOrder = items.some(item => item.supplyType === "PRE_ORDER");
  const depositTotal = items.reduce((total, item) => {
    if (item.supplyType === "PRE_ORDER") {
      return total + (item.price * item.quantity * ((item.depositPercent ?? 100) / 100));
    }
    return total + (item.price * item.quantity);
  }, 0);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    receiverName: customer?.name || "",
    shippingAddress: "",
    receiverPhone: customer?.phoneNumber || "",
    paymentMethod: hasPreOrder ? "BANK_TRANSFER" : "COD" as "COD" | "BANK_TRANSFER" | "VNPAY",
  });

  const [couponInput, setCouponInput] = useState("");
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [guestOtp, setGuestOtp] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const idempotencyKeyRef = useRef<string | null>(null);
  const discountedTotal = Math.max(0, calculatedTotal - couponDiscountAmount);
  const availablePoints = Math.max(0, customer?.points || 0);
  const appliedPoints = Math.min(
    availablePoints,
    pointsToUse,
    Math.floor(discountedTotal / 1_000),
  );
  const pointDiscountAmount = appliedPoints * 1_000;
  const payableTotal = Math.max(0, discountedTotal - pointDiscountAmount);
  const payableDeposit =
    calculatedTotal > 0 && payableTotal > 0
      ? Math.min(
          payableTotal,
          Math.max(1, Math.round(depositTotal * (payableTotal / calculatedTotal))),
        )
      : 0;
  const prepaymentAvailable = bankTransferAvailable || vnpayAvailable;
  const preferredPrepaymentMethod = bankTransferAvailable
    ? "BANK_TRANSFER"
    : vnpayAvailable
      ? "VNPAY"
      : null;
  const methodIsAvailable = (method: "COD" | "BANK_TRANSFER" | "VNPAY") =>
    method === "COD" ||
    (method === "BANK_TRANSFER" && bankTransferAvailable) ||
    (method === "VNPAY" && vnpayAvailable);
  const selectedPaymentMethod = hasPreOrder
    ? formData.paymentMethod !== "COD" && methodIsAvailable(formData.paymentMethod)
      ? formData.paymentMethod
      : preferredPrepaymentMethod || "COD"
    : methodIsAvailable(formData.paymentMethod)
      ? formData.paymentMethod
      : "COD";
  const guestVerificationReady = Boolean(
    customer ||
      (otpSentTo === formData.receiverPhone.trim() && /^\d{6}$/.test(guestOtp)),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = window.setTimeout(
      () => setOtpCountdown((seconds) => seconds - 1),
      1_000,
    );
    return () => window.clearTimeout(timer);
  }, [otpCountdown]);

  if (!mounted) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleSendGuestOtp = async () => {
    setError("");
    const phone = formData.receiverPhone.trim();
    if (!/^(?:\+84|0)[0-9]{9,10}$/.test(phone)) {
      setError("Vui lòng nhập số điện thoại hợp lệ trước khi nhận OTP.");
      return;
    }

    setOtpSending(true);
    try {
      const result = await generateOtp(phone);
      if (!result.success) {
        setError(result.error || "Không thể gửi OTP lúc này.");
        return;
      }
      setGuestOtp("");
      setOtpSentTo(phone);
      setOtpCountdown(60);
      toast.success("Mã OTP đã được gửi và có hiệu lực trong 5 phút.");
    } catch {
      setError("Không thể gửi OTP lúc này. Vui lòng thử lại sau.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Giỏ hàng của bạn đang trống.");
      return;
    }

    if (hasPreOrder && !prepaymentAvailable) {
      setError("Đơn có sản phẩm đặt trước nhưng chưa có kênh thanh toán trước khả dụng.");
      return;
    }
    if (
      !customer &&
      (otpSentTo !== formData.receiverPhone.trim() || !/^\d{6}$/.test(guestOtp))
    ) {
      setError("Vui lòng nhận và nhập đúng 6 chữ số OTP của số điện thoại đặt hàng.");
      return;
    }
    if (!acceptedTerms) {
      setError("Bạn cần đọc và đồng ý với điều khoản mua hàng.");
      return;
    }

    setLoading(true);
    try {
      idempotencyKeyRef.current ||= crypto.randomUUID();
      const paymentMethod = selectedPaymentMethod;
      const res = await processCheckout({
        receiverName: formData.receiverName,
        shippingAddress: formData.shippingAddress,
        receiverPhone: formData.receiverPhone,
        guestOtp: customer ? undefined : guestOtp,
        paymentMethod,
        cartItems: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          expectedUnitPrice: item.price,
          variantId: item.variantId || undefined,
        })),
        couponCode: couponDiscountAmount > 0 ? couponInput : undefined,
        pointsToUse: appliedPoints || undefined,
        affiliateRef: localStorage.getItem("affiliate_ref") || undefined,
        idempotencyKey: idempotencyKeyRef.current,
        acceptedTerms,
      });

      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.success) {
        clearCart();
        const guestQuery = res.guestAccessToken
          ? `?token=${encodeURIComponent(res.guestAccessToken)}`
          : "";
        if (paymentMethod === "VNPAY" && res.paymentRequired) {
          router.push(
            `/api/vnpay/create_url?orderId=${encodeURIComponent(res.orderId)}${
              res.guestAccessToken
                ? `&token=${encodeURIComponent(res.guestAccessToken)}`
                : ""
            }`,
          );
        } else {
          router.push(`/checkout/success/${res.orderId}${guestQuery}`);
        }
      }
    } catch {
      setError("Không thể kết nối để tạo đơn. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  };



  if (items.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
        <div className="mb-6 flex size-24 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-8">
          Bạn chưa có sản phẩm nào trong giỏ hàng.
        </p>
        <Button size="lg" onClick={() => router.push("/shop")}>
          Quay lại cửa hàng
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8 sm:py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-xl font-bold">
                Thông tin giao hàng
              </h2>

              <div className="space-y-3">
                <Label
                  htmlFor="receiverName"
                  className="text-neutral-600 font-medium"
                >
                  Họ và tên người nhận{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiverName"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.receiverName}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverName: e.target.value })
                  }
                  className="h-12 border-neutral-200 focus-visible:ring-[#FF5722]"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="receiverPhone"
                  className="text-neutral-600 font-medium"
                >
                  Số điện thoại người nhận{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiverPhone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="0912345678"
                  value={formData.receiverPhone}
                  onChange={(e) => {
                    const receiverPhone = e.target.value;
                    setFormData({ ...formData, receiverPhone });
                    if (receiverPhone.trim() !== otpSentTo) {
                      setGuestOtp("");
                      setOtpSentTo("");
                      setOtpCountdown(0);
                    }
                  }}
                  className="h-12 border-neutral-200 focus-visible:ring-[#FF5722]"
                />
                {!customer && (
                  <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <Label htmlFor="guestOtp" className="text-sm font-medium text-neutral-700">
                      Xác thực số điện thoại để đặt hàng
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="guestOtp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="Nhập 6 chữ số OTP"
                        value={guestOtp}
                        onChange={(event) =>
                          setGuestOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="h-11 bg-white"
                        disabled={!otpSentTo || loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full bg-white sm:w-auto sm:min-w-32"
                        disabled={otpSending || loading || otpCountdown > 0}
                        onClick={handleSendGuestOtp}
                      >
                        {otpSending && <Loader2 className="mr-1 size-4 animate-spin" />}
                        {otpCountdown > 0
                          ? `Gửi lại (${otpCountdown}s)`
                          : otpSentTo
                            ? "Gửi lại OTP"
                            : "Nhận OTP"}
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-600" aria-live="polite">
                      {otpSentTo
                        ? `Mã đã gửi tới ${otpSentTo}; mã dùng một lần và hết hạn sau 5 phút.`
                        : "Chúng tôi dùng OTP để ngăn đơn giả mạo số điện thoại."}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="shippingAddress"
                  className="text-neutral-600 font-medium"
                >
                  Địa chỉ nhận hàng chi tiết{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shippingAddress"
                  required
                  placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  value={formData.shippingAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingAddress: e.target.value,
                    })
                  }
                  className="h-12 border-neutral-200 focus-visible:ring-[#FF5722]"
                />
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-neutral-100">
              <h2 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-xl font-bold">
                Phương thức thanh toán
              </h2>
              <RadioGroup
                value={selectedPaymentMethod}
                 
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    paymentMethod: value as "COD" | "BANK_TRANSFER" | "VNPAY",
                  })
                }
                className="space-y-3"
              >
                <div className={`flex items-center space-x-4 rounded-xl border p-4 transition-colors ${hasPreOrder ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50' : 'cursor-pointer border-neutral-200 bg-neutral-50/50 hover:border-primary'}`}>
                  <RadioGroupItem value="COD" id="cod" disabled={hasPreOrder} />
                  <div className="flex-1">
                    <Label
                      htmlFor="cod"
                      className={`font-bold ${hasPreOrder ? 'cursor-not-allowed text-neutral-400' : 'cursor-pointer text-neutral-700'}`}
                    >
                      Thanh toán khi nhận hàng (COD)
                    </Label>
                    {hasPreOrder && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Không hỗ trợ COD vì đơn hàng có sản phẩm đặt trước. Vui lòng chọn thanh toán trước.
                      </p>
                    )}
                  </div>
                </div>
                <div className={`flex items-center space-x-4 rounded-xl border p-4 transition-colors ${bankTransferAvailable ? "cursor-pointer border-neutral-200 bg-neutral-50/50 hover:border-primary" : "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50"}`}>
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" disabled={!bankTransferAvailable} />
                  <Label
                    htmlFor="bank"
                    className={`flex-1 font-bold text-[#005BAA] ${bankTransferAvailable ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    Chuyển khoản ngân hàng (VietQR)
                    {!bankTransferAvailable && <span className="mt-1 block text-xs font-normal text-neutral-500">Tạm không khả dụng</span>}
                  </Label>
                </div>
                <div className={`flex items-center space-x-4 rounded-xl border p-4 transition-colors ${vnpayAvailable ? "cursor-pointer border-neutral-200 bg-neutral-50/50 hover:border-primary" : "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50"}`}>
                  <RadioGroupItem value="VNPAY" id="vnpay" disabled={!vnpayAvailable} />
                  <Label
                    htmlFor="vnpay"
                    className={`flex-1 font-bold text-[#005BAA] ${vnpayAvailable ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    Thanh toán trực tuyến qua VNPay
                    {!vnpayAvailable && <span className="mt-1 block text-xs font-normal text-neutral-500">Tạm không khả dụng</span>}
                  </Label>
                </div>
              </RadioGroup>
              {hasPreOrder && !prepaymentAvailable && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Chưa thể đặt sản phẩm đặt trước vì cả chuyển khoản và VNPay đều chưa sẵn sàng.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-[#E30019]">
                {error}
              </div>
            )}

            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 size-4 accent-[#FF5722]"
              />
              <span>
                Tôi đã đọc và đồng ý với{" "}
                <Link className="font-semibold text-primary hover:underline" href="/dieu-khoan-su-dung" target="_blank" rel="noopener noreferrer">
                  điều khoản mua bán
                </Link>
                ,{" "}
                <Link className="font-semibold text-primary hover:underline" href="/chinh-sach-thanh-toan" target="_blank" rel="noopener noreferrer">
                  chính sách thanh toán
                </Link>{" "}
                và{" "}
                <Link className="font-semibold text-primary hover:underline" href="/chinh-sach-doi-tra" target="_blank" rel="noopener noreferrer">
                  đổi trả
                </Link>.
              </span>
            </label>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !acceptedTerms ||
                  !guestVerificationReady ||
                  (hasPreOrder && !prepaymentAvailable)
                }
                className="flex h-14 w-full items-center justify-center rounded-xl text-lg font-bold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-5 h-5 text-white mr-2" />
                )}
                {loading ? "Đang xử lý..." : "Đặt hàng ngay"}
              </Button>
              <div className="mt-4 flex items-center justify-center text-center text-xs font-medium text-neutral-500">
                <ShieldCheck className="w-4 h-4 mr-1 text-green-600" />
                <span>Kết nối thanh toán được bảo vệ bằng HTTPS</span>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-6 border-b border-neutral-100 pb-3 text-xl font-bold">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div
                  key={`${item.id}:${item.variantId || "base"}`}
                  className="flex gap-3 rounded-xl border border-neutral-100 p-3 transition-colors hover:border-neutral-200 sm:gap-4"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-white p-1">
                    {item.imageUrl && (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="80px"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center text-sm">
                    <p className="font-medium line-clamp-2 text-foreground mb-1">
                      {item.title}
                    </p>
                    {item.variantAttributes && (
                      <p className="text-neutral-500 text-xs mb-1">
                        {Object.values(item.variantAttributes).join(" - ")}
                      </p>
                    )}
                    <p className="text-neutral-500 text-xs font-medium">
                      Số lượng:{" "}
                      <span className="text-foreground">{item.quantity}</span>
                    </p>
                  </div>
                  <div className="flex items-center whitespace-nowrap text-sm font-bold text-[#E30019]">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="mb-6 pt-4 border-t border-neutral-100">
              <Label
                htmlFor="coupon"
                className="text-neutral-600 font-medium mb-2 block"
              >
                Mã giảm giá
              </Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Nhập RoboEQ10..."
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1"
                  disabled={couponDiscountAmount > 0}
                />
                <Button
                  type="button"
                  variant={couponDiscountAmount > 0 ? "outline" : "default"}
                  disabled={couponLoading}
                  onClick={async () => {
                    if (couponDiscountAmount > 0) {
                      setCouponDiscountAmount(0);
                      setCouponInput("");
                      return;
                    }
                    if (!couponInput.trim()) return;
                    setCouponLoading(true);
                    try {
                      const res = await validateCoupon(couponInput, calculatedTotal);
                      if (res.success && (res.discountPercent || res.discountValue)) {
                        setCouponDiscountAmount(res.discountAmount);
                      } else {
                        toast.error(res.error || "Mã giảm giá không hợp lệ!");
                      }
                    } catch {
                      toast.error("Không thể kiểm tra mã giảm giá lúc này.");
                    } finally {
                      setCouponLoading(false);
                    }
                  }}
                >
                  {couponLoading && <Loader2 className="mr-1 size-4 animate-spin" />}
                  {couponDiscountAmount > 0 ? "Hủy" : "Áp dụng"}
                </Button>
              </div>
              {couponDiscountAmount > 0 && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  Đã áp dụng mã {couponInput.toUpperCase()}
                </p>
              )}
            </div>

            {customer && (
              <div className="mb-6 border-t border-neutral-100 pt-4">
                <Label htmlFor="loyalty-points" className="mb-2 block font-medium text-neutral-600">
                  Dùng điểm thưởng (hiện có {availablePoints.toLocaleString("vi-VN")})
                </Label>
                <Input
                  id="loyalty-points"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={Math.min(availablePoints, Math.floor(discountedTotal / 1_000))}
                  value={pointsToUse}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value || "0", 10);
                    setPointsToUse(Number.isFinite(value) ? Math.max(0, value) : 0);
                  }}
                />
                <p className="mt-2 text-xs text-neutral-500">1 điểm = 1.000đ; hệ thống chỉ trừ số điểm dùng được.</p>
              </div>
            )}

            <div className="border-t border-neutral-100 pt-6 space-y-4">
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Tạm tính</span>
                <span>{formatPrice(calculatedTotal)}</span>
              </div>

              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(couponDiscountAmount)}</span>
                </div>
              )}

              {pointDiscountAmount > 0 && (
                <div className="flex justify-between font-medium text-blue-700">
                  <span>Đổi {appliedPoints.toLocaleString("vi-VN")} điểm</span>
                  <span>-{formatPrice(pointDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-neutral-100 pt-4 text-xl font-bold">
                <span>Tổng giá trị đơn hàng</span>
                <span className="text-[#E30019]">
                  {formatPrice(payableTotal)}
                </span>
              </div>
              
              {hasPreOrder && (
                <>
                  <div className="flex justify-between font-bold text-lg pt-2 text-amber-600">
                    <span>Thanh toán ngay theo mức cọc của từng sản phẩm</span>
                    <span>
                      {formatPrice(payableDeposit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600 font-medium pt-2">
                    <span>Còn lại thanh toán khi nhận hàng</span>
                    <span>
                      {formatPrice(payableTotal - payableDeposit)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
