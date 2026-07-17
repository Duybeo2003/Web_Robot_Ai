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
    paymentMethod: "COD" as "COD" | "BANK_TRANSFER"
  })

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
      paymentMethod: formData.paymentMethod,
      cartItems: items.map(i => ({ productId: i.id, quantity: i.quantity }))
    })

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else if (res.success) {
      clearCart() // Clear local Zustand cart
      router.push(`/checkout/success/${res.orderId}`)
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
    <div className="container mx-auto px-4 py-12 bg-background min-h-screen">
      <h1 className="text-4xl font-heading font-bold mb-10 text-foreground tracking-tight">Thanh toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-semibold border-b border-border/50 pb-3">Thông tin giao hàng</h2>
              
              <div className="space-y-3 max-w-md">
                <Label htmlFor="receiverPhone" className="text-muted-foreground">Số điện thoại người nhận</Label>
                <Input 
                  id="receiverPhone" 
                  required 
                  placeholder="0912345678"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData({...formData, receiverPhone: e.target.value})}
                />
              </div>

              <div className="space-y-3 max-w-md">
                <Label htmlFor="shippingAddress" className="text-muted-foreground">Địa chỉ nhận hàng chi tiết</Label>
                <Input 
                  id="shippingAddress" 
                  required 
                  placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-semibold border-b border-border/50 pb-3">Phương thức thanh toán</h2>
              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(val: any) => setFormData({...formData, paymentMethod: val})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-4 border border-border p-5 rounded-sm cursor-pointer hover:border-primary/50 transition-colors bg-card">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer font-medium flex-1">Thanh toán khi nhận hàng (COD)</Label>
                </div>
                <div className="flex items-center space-x-4 border border-border p-5 rounded-sm cursor-pointer hover:border-primary/50 transition-colors bg-card">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                  <Label htmlFor="bank" className="cursor-pointer font-medium flex-1">Chuyển khoản ngân hàng (Thủ công)</Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-4 max-w-md">
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg rounded-sm flex items-center justify-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                {loading ? "Đang xử lý..." : "Đặt hàng an toàn"}
              </Button>
              <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mr-1 text-secondary" />
                <span>Mọi thông tin đều được mã hoá bảo mật 256-bit</span>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-card p-8 rounded-sm border border-border sticky top-24 shadow-sm">
            <h2 className="text-2xl font-heading font-semibold mb-8">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-sm overflow-hidden border border-border shrink-0">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 text-sm flex flex-col justify-center">
                    <p className="font-semibold line-clamp-2 text-foreground">{item.title}</p>
                    <p className="text-muted-foreground mt-1">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="font-semibold text-sm flex items-center">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span>{formatPrice(calculatedTotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold text-2xl pt-4 border-t border-border">
                <span className="font-heading">Tổng cộng</span>
                <span className="text-primary">{formatPrice(calculatedTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
