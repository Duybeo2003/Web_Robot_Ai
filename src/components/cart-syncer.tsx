"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function CartSyncer() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const replaceItems = useCartStore((state) => state.replaceItems);
  const mergedUserId = useRef<string | null>(null);
  const authenticatedUserId =
    status === "authenticated" ? session?.user?.id || null : null;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && !authenticatedUserId) return;
    if (status === "unauthenticated") mergedUserId.current = null;
    
    const abortController = new AbortController();
    const syncTimeout = setTimeout(async () => {
      try {
        const mode =
          authenticatedUserId && mergedUserId.current !== authenticatedUserId
            ? "merge"
            : "replace";
        const response = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, mode }),
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
        if (authenticatedUserId) mergedUserId.current = authenticatedUserId;
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
  }, [status, authenticatedUserId, pathname, items, replaceItems]);

  return null;
}
