"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { openCashfreeCheckout, verifyCashfreePayment } from "@/components/cashfree-checkout";
import { useToast } from "@/components/toast";

interface CashfreeHandoff {
  appId?: string;
  mode?: string;
  paymentSessionId: string;
  gatewayOrderId?: string;
}

export function PayNowButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const pay = async () => {
    setPending(true);
    try {
      const response = await fetch("/api/payments/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        simulated?: boolean;
        alreadyPaid?: boolean;
        error?: string;
        handoff?: CashfreeHandoff;
      };
      if (data.alreadyPaid) {
        toast("Payment already received. Your order is marked paid.");
        router.refresh();
        return;
      }
      if (data.simulated) {
        toast("Payment recorded successfully!");
        router.refresh();
        return;
      }
      if (!response.ok || !data.handoff) {
        toast(data.error ?? "Could not start the payment.", "error");
        return;
      }

      const result = await openCashfreeCheckout({
        appId: data.handoff.appId,
        mode: data.handoff.mode,
        paymentSessionId: data.handoff.paymentSessionId,
      });
      if (!result.completed) {
        if (result.sdkError === "load") {
          toast("The payment window could not load. Please try again.", "error");
        } else if (result.redirect) {
          toast("Follow the payment steps in the opened window, then refresh this page.", "error");
        } else {
          toast("The payment was not completed. No money has been taken.", "error");
        }
        return;
      }

      toast("Payment received. Finalising your order…");
      const verified = await verifyCashfreePayment(orderId, data.handoff.gatewayOrderId);
      if (verified.ok) {
        toast("Payment received. Thank you!");
        router.refresh();
        return;
      }
      if (verified.pending) {
        toast(
          "Your payment is nearly done, but confirmation is taking a moment. Refresh your order page shortly.",
          "error",
        );
        return;
      }
      toast(verified.error ?? "Payment verification failed. Please contact support.", "error");
    } catch {
      toast("Something went wrong starting the payment.", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button type="button" onClick={pay} disabled={pending} size="sm">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
      Pay now
    </Button>
  );
}
