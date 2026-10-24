"use client";

import { useEffect } from "react";
import { recordProductViewAction } from "@/lib/actions/account";

export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void recordProductViewAction(productId);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [productId]);
  return null;
}
