import { NextResponse } from "next/server";
import { finalizeCheckoutIntentByReference } from "@/lib/checkout-intents";
import { markOrderPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/cashfree";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface CashfreeWebhook {
  /** e.g. "PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK", "ORDER_PAID". */
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
    };
    payment?: {
      cf_payment_id?: string;
      payment_id?: string;
      order_id?: string;
      order_amount?: number;
      amount?: number;
      payment_status?: string;
      payment_method?: { upi?: unknown; card?: unknown } | string;
      customer_details?: {
        email?: string;
        phone?: string;
      };
    };
  };
  /** Legacy payload shape, kept for forward compatibility. */
  payload?: {
    payment?: {
      entity?: {
        payment_id?: string;
        cf_payment_id?: string;
        order_id?: string;
        amount?: number;
        order_amount?: number;
        status?: string;
        payment_status?: string;
        method?: string;
        customer_details?: {
          email?: string;
          phone?: string;
        };
      };
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-webhook-timestamp");
  const signature = request.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: CashfreeWebhook;
  try {
    event = JSON.parse(rawBody) as CashfreeWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const legacy = event.payload?.payment?.entity;
  const modern = event.data?.payment;
  const payment = modern
    ? {
        cfPaymentId: modern.cf_payment_id ?? modern.payment_id,
        orderId: modern.order_id,
        amount: modern.order_amount ?? modern.amount ?? 0,
        status: (modern.payment_status ?? "").toUpperCase(),
        method: typeof modern.payment_method === "string" ? modern.payment_method : Object.keys(modern.payment_method ?? {})[0],
        email: modern.customer_details?.email,
        phone: modern.customer_details?.phone,
      }
    : legacy
      ? {
          cfPaymentId: legacy.cf_payment_id ?? legacy.payment_id,
          orderId: legacy.order_id,
          amount: legacy.order_amount ?? legacy.amount ?? 0,
          status: (legacy.payment_status ?? legacy.status ?? "").toUpperCase(),
          method: legacy.method,
          email: legacy.customer_details?.email,
          phone: legacy.customer_details?.phone,
        }
      : null;
  if (!payment) return NextResponse.json({ received: true });

  if (payment.status === "SUCCESS") {
    const rawPayload = {
      id: payment.cfPaymentId,
      type: event.type,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      email: payment.email,
      phone: payment.phone,
    };
    const result = await markOrderPaid({
      gatewayOrderId: payment.orderId,
      gatewayPaymentId: payment.cfPaymentId ?? `cashfree_${payment.orderId}`,
      amountInPaise: Math.round(payment.amount * 100),
      rawPayload,
    });
    if (result.ok) return NextResponse.json({ received: true, processed: true });

    // A new online checkout has no order until payment succeeds. If the
    // browser closed before calling the completion endpoint, create the order
    // here from the signed checkout intent.
    if (payment.orderId) {
      const finalized = await finalizeCheckoutIntentByReference(payment.orderId, {
        gatewayPaymentId: payment.cfPaymentId ?? `cashfree_${payment.orderId}`,
        amountInPaise: Math.round(payment.amount * 100),
        rawPayload,
      });
      if (finalized.ok) return NextResponse.json({ received: true, processed: true });
      if ("notFound" in finalized && finalized.notFound) {
        console.error("[webhook] no order or checkout intent for", payment.orderId);
      } else if (!("pending" in finalized && finalized.pending)) {
        console.error("[webhook] checkout intent finalization issue", finalized.error);
      }
      return NextResponse.json({ received: true, processed: false });
    }

    console.error("[webhook] payment processing issue", result.error);
    return NextResponse.json({ received: true, processed: false });
  }

  if (payment.cfPaymentId && isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    await admin
      .from("payments")
      .update({
        status: payment.status === "FAILED" ? "failed" : "pending",
        gateway_payment_id: payment.cfPaymentId,
      })
      .eq("gateway_order_id", payment.orderId);
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
