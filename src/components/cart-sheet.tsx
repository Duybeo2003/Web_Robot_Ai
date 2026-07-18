"use client"

import { useCartStore } from "@/lib/store/cart"
import { useCartUI } from "@/store/use-cart-ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag, Truck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function CartSheet() {
  const router = useRouter()
  const { isOpen, closeCart } = useCartUI()
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore()
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center text-xl font-bold">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Giỏ hàng của bạn
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5722] mb-2 shadow-inner">
              <ShoppingBag className="w-16 h-16 opacity-80" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-gray-800">Giỏ hàng trống</p>
              <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">Chưa có sản phẩm nào trong giỏ hàng của bạn. Hãy khám phá các robot giáo dục tuyệt vời của chúng tôi!</p>
            </div>
            <Button 
              onClick={() => {
                closeCart()
                router.push('/shop')
              }} 
              className="mt-6 rounded-xl bg-[#FF5722] hover:bg-[#E64A19] text-white px-8 h-12 shadow-md transition-transform hover:-translate-y-0.5"
            >
              Bắt đầu mua sắm
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <div className="relative w-full h-full">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="80px" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <Link 
                          href={`/shop/${item.slug}`} 
                          onClick={closeCart}
                          className="font-semibold text-sm line-clamp-2 hover:text-blue-600 transition-colors"
                        >
                          {item.title}
                        </Link>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border rounded-lg bg-background">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-bold text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t bg-gray-50/50">
              <div className="bg-green-50 text-green-700 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 mb-4 text-sm font-medium border border-green-100">
                <Truck className="w-4 h-4" />
                Đơn hàng của bạn được Miễn phí vận chuyển!
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-600">Tổng tạm tính</span>
                <span className="text-xl font-bold text-[#E30019]">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <Button 
                className="w-full h-14 rounded-xl text-base font-bold bg-[#FF5722] hover:bg-[#E64A19] text-white shadow-md transition-all hover:-translate-y-0.5"
                onClick={() => {
                  closeCart()
                  router.push('/checkout')
                }}
              >
                Tiến hành Thanh toán
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
