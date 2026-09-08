"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function CartSyncer() {
  const { status } = useSession();
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const replaceItems = useCartStore((state) => state.replaceItems);

  useEffect(() => {
    if (status === "loading") return;
    
    const abortController = new AbortController();
    const syncTimeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          signal: abortController.signal,
        });
        if (!response.ok) {
          if (response.status >= 500) throw new Error(`Cart sync failed (${response.status})`);
          return;
        }
        const result = (await response.json()) as {
          success?: boolean;
          items?: CartItem[];
          adjusted?: boolean;
        };
        if (!result.success || !Array.isArray(result.items)) return;
        if (JSON.stringify(result.items) !== JSON.stringify(items)) {
          replaceItems(result.items);
        }
        if (result.adjusted) {
          toast.info("Giỏ hàng đã được cập nhật theo giá và tồn kho hiện tại.");
        }
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
  }, [status, pathname, items, replaceItems]);

  return null;
}
