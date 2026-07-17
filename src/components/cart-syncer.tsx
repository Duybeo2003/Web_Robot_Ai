"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/store/cart"

export function CartSyncer() {
  const { data: session, status } = useSession()
  const items = useCartStore((state) => state.items)

  useEffect(() => {
    // Only sync when user is authenticated and there are items to sync
    if (status === "authenticated" && items.length > 0) {
      const sync = async () => {
        try {
          await fetch("/api/cart/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
          })
          // In a full implementation, we might want to update local state 
          // with the DB response, but for MVP, local state drives the DB.
        } catch (error) {
          console.error("Failed to sync cart", error)
        }
      }
      
      sync()
    }
  }, [status, items])

  return null
}
