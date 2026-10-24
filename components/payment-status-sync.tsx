"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { verifyCashfreePayment } from "@/components/cashfree-checkout";

/**
 * Reconciles an online order that is still marked unpaid.
 *
 * The checkout verifies payments immediately, but confirmation can land late or
 * the browser can close before verification finishes. Opening the order then
 * asks Cashfree for the authoritative status and refreshes the page if the
 * payment was captured.
 */
export function PaymentStatusSync({ orderId }: { orderId: string }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      const result = await verifyCashfreePayment(orderId, undefined, 2, 2000);
      if (!cancelled && result.ok) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  return null;
}
