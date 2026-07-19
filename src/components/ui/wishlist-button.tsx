"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react";
import { theme } from "@/components/ui/theme";
import { toggleWishlist } from "@/actions/wishlist"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export function WishlistButton({ productId, initiallyWished = false }: { productId: string, initiallyWished?: boolean }) {
  const [isWished, setIsWished] = useState(initiallyWished)
  const [isPending, startTransition] = useTransition()
  const { status } = useSession()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating if it's inside a Link
    
    if (status !== "authenticated") {
      toast.error("Vui lòng đăng nhập để lưu sản phẩm yêu thích")
      return
    }

    startTransition(async () => {
      // Optimistic update
      setIsWished(!isWished)
      
      const res = await toggleWishlist(productId)
      
      if (!res.success) {
        setIsWished(isWished) // revert
        toast.error(res.error)
      } else {
        setIsWished(res.isWished!)
        toast.success(res.isWished ? "Đã thêm vào mục yêu thích" : "Đã bỏ khỏi mục yêu thích")
      }
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors focus:outline-none ${isWished ? 'text-primary' : 'text-neutral-500 hover:text-primary'}`}
      title="Yêu thích"
    >
      <Heart className={`w-5 h-5 ${isWished ? 'fill-primary text-primary' : ''}`} />
    </button>
  )
}
