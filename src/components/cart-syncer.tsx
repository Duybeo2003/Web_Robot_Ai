"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";

export function CartSyncer() {
  const { status } = useSession();
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    if (status !== "authenticated" || items.length === 0) return;
    
    const abortController = new AbortController();
    const syncTimeout = setTimeout(async () => {
      try {
        await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          signal: abortController.signal,
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Failed to sync cart", error);
        }
      }
    }, 500);

    return () => {
      clearTimeout(syncTimeout);
      abortController.abort();
    };
  }, [status, items]);

  return null;
}
