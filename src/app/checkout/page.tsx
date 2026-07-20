"use client"

import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/store/cart"
import { useAuthModal } from "@/store/use-auth-modal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { processCheckout } from "@/actions/checkout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingBag, Loader2, ArrowRight, ShieldCheck, Lock } from "lucide-react"
import { validateCoupon } from "@/actions/coupon"
import Image from "next/image"

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { openModal } = useAuthModal()
  const router = useRouter()
  
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  // FIX: Calculate total locally to avoid Zustand persist getter mismatch
  const calculatedTotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    shippingAddress: "",
    receiverPhone: "",
    paymentMethod: "COD" as "COD" | "BANK_TRANSFER" | "VNPAY"
  })

  const [couponInput, setCouponInput] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (items.length === 0) {
      setError("Giỏ hàng của bạn đang trống.")
      return
    }

    setLoading(true)
    const res = await processCheckout({
      shippingAddress: formData.shippingAddress,
      receiverPhone: formData.receiverPhone,
      paymentMethod: formData.paymentMethod === "VNPAY" ? "BANK_TRANSFER" : formData.paymentMethod,
      cartItems: items.map(i => ({ productId: i.id, quantity: i.quantity })),
      couponCode: appliedDiscount > 0 ? couponInput : undefined
    })

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else if (res.success) {
      clearCart() // Clear local Zustand cart
      const finalTotal = calculatedTotal - (calculatedTotal * (appliedDiscount / 100));
      if (formData.paymentMethod === "VNPAY") {
        router.push(`/api/vnpay/create_url?orderId=${res.orderId}&amount=${finalTotal}`)
      } else {
        router.push(`/checkout/success/${res.orderId}`)
      }
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold mb-4">Bạn cần đăng nhập</h1>
        <p className="text-muted-foreground mb-8">Vui lòng đăng nhập để tiếp tục quá trình thanh toán.</p>
        <Button size="lg" onClick={openModal}>Đăng nhập ngay</Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <Button size="lg" onClick={() => router.push("/shop")}>Quay lại cửa hàng</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#F5F5F5] min-h-screen">
      <h1 className="text-3xl font-heading font-bold mb-8 text-foreground tracking-tight uppercase text-[#FF5722]">Thanh toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-sm shadow-sm border border-neutral-100">
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold border-b border-neutral-100 pb-3 flex items-center gap-2">
                Thông tin giao hàng
              </h2>
              
              <div className="space-y-3">
                <Label htmlFor="receiverPhone" className="text-neutral-600 font-medium">Số điện thoại người nhận <span className="text-red-500">*</span></Label>
                <Input 
                  id="receiverPhone" 
                  required 
                  placeholder="0912345678"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData({...formData, receiverPhone: e.target.value})}
                  className="h-12 border-neutral-200 focus-visible:ring-[#FF5722]"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="shippingAddress" className="text-neutral-600 font-medium">Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span></Label>
                <Input 
                  id="shippingAddress" 
                  required 
                  placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                  className="h-12 border-neutral-200 focus-visible:ring-[#FF5722]"
                />
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-neutral-100">
              <h2 className="text-xl font-heading font-bold border-b border-neutral-100 pb-3 flex items-center gap-2">Phương thức thanh toán</h2>
              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(val: any) => setFormData({...formData, paymentMethod: val})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-4 border border-neutral-200 p-4 rounded-sm cursor-pointer hover:border-[#FF5722] transition-colors bg-neutral-50/50">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer font-bold text-neutral-700 flex-1">Thanh toán khi nhận hàng (COD)</Label>
                </div>
                <div className="flex items-center space-x-4 border border-neutral-200 p-4 rounded-sm cursor-pointer hover:border-[#FF5722] transition-colors bg-neutral-50/50">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                  <Label htmlFor="bank" className="cursor-pointer font-bold text-neutral-700 flex-1">Chuyển khoản ngân hàng (Thủ công)</Label>
                </div>
                <div className="flex items-center space-x-4 border border-neutral-200 p-4 rounded-sm cursor-pointer hover:border-[#FF5722] transition-colors bg-blue-50/50 border-blue-100">
                  <RadioGroupItem value="VNPAY" id="vnpay" />
                  <Label htmlFor="vnpay" className="cursor-pointer font-bold text-[#005BAA] flex-1">Thanh toán qua VNPay (Trực tuyến)</Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-[#E30019] rounded-sm font-medium text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-6">
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold rounded-sm flex items-center justify-center bg-[#FF5722] hover:bg-[#E64A19] text-white transition-colors">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
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
            <h2 className="text-xl font-heading font-bold mb-6 border-b border-neutral-100 pb-3">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 border border-neutral-100 rounded-sm hover:border-neutral-200 transition-colors">
                  <div className="w-20 h-20 bg-white rounded-sm overflow-hidden border border-neutral-100 shrink-0 p-1">
                    {item.imageUrl && (
                      <div className="relative w-full h-full">
                        <Image src={item.imageUrl} alt="" fill className="object-contain" sizes="80px" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-sm flex flex-col justify-center">
                    <p className="font-medium line-clamp-2 text-foreground mb-1">{item.title}</p>
                    <p className="text-neutral-500 text-xs font-medium">Số lượng: <span className="text-foreground">{item.quantity}</span></p>
                  </div>
                  <div className="font-bold text-[#E30019] text-sm flex items-center">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="mb-6 pt-4 border-t border-neutral-100">
              <Label htmlFor="coupon" className="text-neutral-600 font-medium mb-2 block">Mã giảm giá</Label>
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
                      setAppliedDiscount(0)
                      setCouponInput("")
                    } else {
                      if (!couponInput) return;
                      const res = await validateCoupon(couponInput);
                      if (res.success && res.discountPercent) {
                        setAppliedDiscount(res.discountPercent)
                      } else {
                        alert(res.error || "Mã giảm giá không hợp lệ!")
                      }
                    }
                  }}
                >
                  {appliedDiscount > 0 ? "Hủy" : "Áp dụng"}
                </Button>
              </div>
              {appliedDiscount > 0 && (
                <p className="text-sm text-green-600 mt-2 font-medium">Đã áp dụng mã giảm giá {appliedDiscount}%</p>
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
                  <span>-{formatPrice(calculatedTotal * (appliedDiscount / 100))}</span>
                </div>
              )}
              
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-neutral-100">
                <span className="font-heading uppercase">Tổng cộng</span>
                <span className="text-[#E30019] text-2xl">
                  {formatPrice(calculatedTotal - (calculatedTotal * (appliedDiscount / 100)))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
