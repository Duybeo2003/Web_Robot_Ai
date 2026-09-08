"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/store/use-auth-modal";

export function AuthModalLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openModal = useAuthModal((state) => state.openModal);
  const shouldOpen = searchParams.get("login") === "true";
  const queryString = searchParams.toString();

  useEffect(() => {
    if (!shouldOpen) return;
    openModal();

    const nextParams = new URLSearchParams(queryString);
    nextParams.delete("login");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [openModal, pathname, queryString, router, shouldOpen]);

  return null;
}
