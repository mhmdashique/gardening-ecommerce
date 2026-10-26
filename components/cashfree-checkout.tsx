"use client";

/**
 * Cashfree Payment Gateway (drop-in checkout, Lite JS SDK).
 *
 * Flow: the server creates a Cashfree order and returns the payment session id;
 * this module opens the hosted checkout in a popup modal and, once the widget
 * resolves, confirms the payment with `/api/payments/verify` which validates it
 * against Cashfree's own payment records before marking the order paid.
 */

const SDK_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

interface CashfreeInstance {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: string;
  }) => Promise<{ error?: unknown; redirect?: unknown } | undefined>;
}

declare global {
  interface Window {
    Cashfree?: (init: { mode?: string; appId?: string }) => CashfreeInstance;
  }
}

export function loadCashfreeSdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Cashfree) return resolve(true);
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface CashfreeCheckoutResult {
  /** The widget resolved with no error — verify with the server before trusting it. */
  completed: boolean;
  /** The user closed the popup without paying. */
  dismissed: boolean;
  /** Cashfree took over navigation (e.g. a bank/UPI redirect inside the modal). */
  redirect: boolean;
  /** The SDK could not load or crashed. */
  sdkError?: string;
}

export async function openCashfreeCheckout(params: {
  appId?: string;
  mode?: string;
  paymentSessionId: string;
}): Promise<CashfreeCheckoutResult> {
  const ready = await loadCashfreeSdk();
  if (!ready || !window.Cashfree) {
    return { completed: false, dismissed: false, redirect: false, sdkError: "load" };
  }

  // The SDK renders a fixed 100vw/100svh iframe. Temporarily cancel the
  // site-wide 0.9 zoom so the hosted checkout truly fills the viewport and
  // sits above the mobile dock.
  const root = document.documentElement;
  root.classList.add("cashfree-checkout-open");
  try {
    const cashfree = window.Cashfree({ mode: params.mode || "sandbox", appId: params.appId });
    const result = await cashfree.checkout({
      paymentSessionId: params.paymentSessionId,
      redirectTarget: "_modal",
    });
    if (result?.redirect) return { completed: false, dismissed: false, redirect: true };
    if (result?.error) {
      // Surfaced in the browser console so a gateway failure is traceable.
      console.error("[cashfree] checkout returned an error", result.error);
      return { completed: false, dismissed: true, redirect: false };
    }
    return { completed: true, dismissed: false, redirect: false };
  } catch (error) {
    console.error("[cashfree] checkout threw", error);
    return { completed: false, dismissed: true, redirect: false, sdkError: "open" };
  } finally {
    root.classList.remove("cashfree-checkout-open");
  }
}

export interface CashfreeVerifyResult {
  ok?: boolean;
  error?: string;
  /** True when the payment simply isn't recorded yet — safe to retry. */
  pending?: boolean;
}

/**
 * Asks the server to confirm the payment against Cashfree's records.
 * Retries a few times because gateway confirmation can land seconds late.
 */
export async function verifyCashfreePayment(
  orderId: string,
  gatewayOrderId: string | undefined,
  attempts = 4,
  waitMs = 2500,
): Promise<CashfreeVerifyResult> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (!navigator.onLine) return { error: "You appear to be offline. Please check your connection." };
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, gatewayOrderId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; alreadyProcessed?: boolean };
      if (response.ok && data.ok) return { ok: true };
      if (response.status === 402) {
        if (attempt < attempts - 1) {
          await new Promise((resolve) => {
            if (typeof window === "undefined") resolve(undefined);
            else window.setTimeout(resolve, waitMs);
          });
          continue;
        }
        return { pending: true, error: data.error };
      }
      return { error: data.error ?? "We could not confirm your payment. Please contact support with your order number." };
    } catch {
      if (attempt < attempts - 1) continue;
      return { error: "We could not confirm your payment. Please contact support with your order number." };
    }
  }
  return { error: "Verification failed." };
}
