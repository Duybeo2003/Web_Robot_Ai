"use client"

import { useState } from "react"
import { useCartStore } from "@/lib/store/cart"
import { useCartUI } from "@/store/use-cart-ui"
import { Button } from "@/components/ui/button"
import { Minus, Plus, ShoppingCart, ShoppingBag } from "lucide-react"

interface AddToCartProps {
  product: {
    id: string
    title: string
    price: number
    slug: string
    imageUrl: string
  }
}

export function AddToCartForm({ product }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartUI((state) => state.openCart)

  const handleAddToCart = () => {
    addItem({ ...product, quantity })
    openCart() // Open the cart sheet automatically
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Quantity Selector */}
      <div className="flex items-center justify-between border-2 border-gray-200 rounded-2xl p-1 h-14 w-full sm:w-36 bg-background">
        <button 
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-bold text-lg w-8 text-center">{quantity}</span>
        <button 
          onClick={() => setQuantity(quantity + 1)}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <Button 
        onClick={handleAddToCart}
        className="flex-1 h-14 rounded-sm text-base font-bold shadow-md hover:shadow-xl transition-all gap-2 bg-[#FF5722] hover:bg-[#E64A19] text-white hover:-translate-y-0.5"
      >
        <ShoppingCart className="w-5 h-5" />
        Thêm vào giỏ
      </Button>

      <Button 
        variant="secondary"
        onClick={() => {
          addItem({ ...product, quantity })
          // Redirect to checkout in the future
        }}
        className="flex-1 h-14 rounded-sm text-base font-bold shadow-sm hover:shadow-md transition-all gap-2 bg-neutral-900 text-white hover:bg-neutral-800 hover:-translate-y-0.5"
      >
        <ShoppingBag className="w-5 h-5" />
        Mua ngay
      </Button>
    </div>
  )
}
