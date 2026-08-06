"use client";

import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { processCheckout } from "@/actions/checkout";
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

export default function CheckoutPage() {
  const { data: session } = useSession();
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
      return total + (item.price * item.quantity * 0.7);
    }
    return total + (item.price * item.quantity);
  }, 0);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    receiverName: session?.user?.name || "",
    shippingAddress: "",
    receiverPhone: "",
    paymentMethod: hasPreOrder ? "BANK_TRANSFER" : "COD" as "COD" | "BANK_TRANSFER" | "VNPAY",
  });

  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Giỏ hàng của bạn đang trống.");
      return;
    }

    setLoading(true);
    const res = await processCheckout({
      receiverName: formData.receiverName,
      shippingAddress: formData.shippingAddress,
      receiverPhone: formData.receiverPhone,
      paymentMethod:
        formData.paymentMethod === "VNPAY"
          ? "BANK_TRANSFER"
          : formData.paymentMethod,
      cartItems: items.map((i) => ({ 
        productId: i.id, 
        quantity: i.quantity,
        variantId: i.variantId || undefined
      })),
      couponCode: appliedDiscount > 0 ? couponInput : undefined,
      affiliateRef: localStorage.getItem("affiliate_ref") || undefined,
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.success) {
      clearCart(); // Clear local Zustand cart
      router.push(`/checkout/success/${res.orderId}`);
    }
  };



  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-8">
          Bạn chưa có sản phẩm nào trong giỏ hàng.
        </p>
        <Button size="lg" onClick={() => router.push("/shop")}>
          Quay lại cửa hàng
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#F5F5F5] min-h-screen">
      <h1 className="text-3xl font-heading font-bold mb-8 text-foreground tracking-tight uppercase text-[#FF5722]">
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 bg-white p-6 md:p-8 rounded-sm shadow-sm border border-neutral-100"
          >
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold border-b border-neutral-100 pb-3 flex items-center gap-2">
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
                  required
                  placeholder="0912345678"
                  value={formData.receiverPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverPhone: e.target.value })
                  }
                  className="h-12 border-neutral-200 focus-visible:ring-[#FF5722]"
                />
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
              <h2 className="text-xl font-heading font-bold border-b border-neutral-100 pb-3 flex items-center gap-2">
                Phương thức thanh toán
              </h2>
              <RadioGroup
                value={formData.paymentMethod}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onValueChange={(val: any) =>
                  setFormData({ ...formData, paymentMethod: val })
                }
                className="space-y-3"
              >
                <div className={`flex items-center space-x-4 border p-4 rounded-sm transition-colors ${hasPreOrder ? 'opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-neutral-200 cursor-pointer hover:border-[#FF5722] bg-neutral-50/50'}`}>
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
                        Không hỗ trợ COD do đơn hàng có chứa sản phẩm Pre-order. Vui lòng chọn thanh toán trước.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 border border-neutral-200 p-4 rounded-sm cursor-pointer hover:border-[#FF5722] transition-colors bg-neutral-50/50">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                  <Label
                    htmlFor="bank"
                    className="cursor-pointer font-bold text-[#005BAA] flex-1"
                  >
                    Chuyển khoản Ngân hàng (Quét mã QR)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-[#E30019] rounded-sm font-medium text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-bold rounded-sm flex items-center justify-center bg-[#FF5722] hover:bg-[#E64A19] text-white transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-5 h-5 text-white mr-2" />
                )}
                {loading ? "Đang xử lý..." : "ĐẶT HÀNG NGAY"}
              </Button>
              <div className="flex items-center justify-center mt-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 mr-1 text-green-600" />
                <span>Mọi thông tin đều được mã hoá bảo mật 256-bit</span>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-sm border border-neutral-100 sticky top-24 shadow-sm">
            <h2 className="text-xl font-heading font-bold mb-6 border-b border-neutral-100 pb-3">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 border border-neutral-100 rounded-sm hover:border-neutral-200 transition-colors"
                >
                  <div className="w-20 h-20 bg-white rounded-sm overflow-hidden border border-neutral-100 shrink-0 p-1">
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
                  <div className="flex-1 text-sm flex flex-col justify-center">
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
                  <div className="font-bold text-[#E30019] text-sm flex items-center">
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
                  placeholder="Nhập ROBOED10..."
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1"
                  disabled={appliedDiscount > 0}
                />
                <Button
                  type="button"
                  variant={appliedDiscount > 0 ? "outline" : "default"}
                  onClick={async () => {
                    if (appliedDiscount > 0) {
                      setAppliedDiscount(0);
                      setCouponInput("");
                    } else {
                      if (!couponInput) return;
                      const res = await validateCoupon(couponInput);
                      if (res.success && res.discountPercent) {
                        setAppliedDiscount(res.discountPercent);
                      } else {
                        alert(res.error || "Mã giảm giá không hợp lệ!");
                      }
                    }
                  }}
                >
                  {appliedDiscount > 0 ? "Hủy" : "Áp dụng"}
                </Button>
              </div>
              {appliedDiscount > 0 && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  Đã áp dụng mã giảm giá {appliedDiscount}%
                </p>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-6 space-y-4">
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Tạm tính</span>
                <span>{formatPrice(calculatedTotal)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Giảm giá ({appliedDiscount}%)</span>
                  <span>
                    -{formatPrice(calculatedTotal * (appliedDiscount / 100))}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-neutral-100">
                <span className="font-heading uppercase">Tổng giá trị đơn hàng</span>
                <span className="text-[#E30019]">
                  {formatPrice(
                    calculatedTotal - calculatedTotal * (appliedDiscount / 100),
                  )}
                </span>
              </div>
              
              {hasPreOrder && (
                <>
                  <div className="flex justify-between font-bold text-lg pt-2 text-amber-600">
                    <span>Thanh toán ngay (Cọc 70% hàng Order)</span>
                    <span>
                      {formatPrice(
                        Math.max(0, depositTotal - calculatedTotal * (appliedDiscount / 100))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600 font-medium pt-2">
                    <span>Còn lại thanh toán khi nhận hàng</span>
                    <span>
                      {formatPrice(
                        (calculatedTotal - calculatedTotal * (appliedDiscount / 100)) - Math.max(0, depositTotal - calculatedTotal * (appliedDiscount / 100))
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
