"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/store/cart"
import { useCartUI } from "@/store/use-cart-ui"

interface AddToCartButtonProps {
  product: {
    id: string
    title: string
    price: number
    slug: string
    imageUrl: string
  }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartUI((state) => state.openCart)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if wrapped in link
    e.stopPropagation() // Prevent event bubbling
    
    addItem({ ...product, quantity: 1 })
    openCart()
  }

  return (
    <Button 
      size="icon" 
      onClick={handleAddToCart}
      className="rounded-full shadow-md hover:shadow-lg transition-all"
    >
      <ShoppingCart className="w-4 h-4" />
    </Button>
  )
}
