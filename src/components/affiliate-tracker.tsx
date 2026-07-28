"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Store the referrer ID in localStorage
      localStorage.setItem("affiliate_ref", ref);
      localStorage.setItem("affiliate_ref_date", Date.now().toString());
    }
  }, [searchParams]);

  return null;
}
