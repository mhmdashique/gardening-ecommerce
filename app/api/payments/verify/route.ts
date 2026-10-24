import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/catalog";
import { markOrderPaid } from "@/lib/orders";
import {
  fetchCashfreeOrderPayments,
  findSuccessfulPayment,
  cashfreeConfigured,
} from "@/lib/cashfree";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const limit = rateLimit(`verify:${user.id}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  let body: {
    orderId?: string;
    /** Kept for backwards compatibility; the server resolves the gateway id itself. */
    gatewayOrderId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.orderId) return NextResponse.json({ error: "Order reference missing." }, { status: 400 });
  // Admins may re-check any order; customers only their own.
  const order = await getOrderForUser(body.orderId, user.role === "admin" ? undefined : user.id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.payment_method !== "online") {
    return NextResponse.json({ error: "This order does not use online payment." }, { status: 400 });
  }
  if (order.payment_status === "paid") return NextResponse.json({ ok: true, alreadyProcessed: true });

  if (!cashfreeConfigured()) {
    return NextResponse.json({ error: "Online payments are not configured." }, { status: 400 });
  }

  // Resolve the Cashfree order reference server-side. The gateway row saved at
  // creation time is authoritative (a retry may have created a new Cashfree
  // order id); otherwise fall back to the merchant order number, which is what
  // the order was created with. A client-supplied id is never trusted here.
  let gatewayOrderId = order.order_number;
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data: paymentRow } = await admin
      .from("payments")
      .select("gateway_order_id")
      .eq("order_id", order.id)
      .eq("gateway", "cashfree")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (paymentRow?.gateway_order_id) gatewayOrderId = paymentRow.gateway_order_id;
  }

  const payments = await fetchCashfreeOrderPayments(gatewayOrderId);
  const success = findSuccessfulPayment(payments);
  if (!success) {
    return NextResponse.json({ error: "Payment has not been completed yet." }, { status: 402 });
  }

  const result = await markOrderPaid({
    orderId: order.id,
    gatewayOrderId,
    gatewayPaymentId: success.cf_payment_id,
    amountInPaise: Math.round(Number(success.order_amount) * 100),
    rawPayload: {
      id: success.cf_payment_id,
      status: success.payment_status,
      amount: success.payment_amount ?? success.order_amount,
      method: typeof success.payment_method === "string" ? success.payment_method : undefined,
    },
  });
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Could not confirm payment." }, { status: 400 });
  return NextResponse.json({ ok: true, alreadyProcessed: result.alreadyProcessed });
}
