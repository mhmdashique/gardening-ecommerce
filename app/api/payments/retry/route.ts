import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrderForUser, getSettings } from "@/lib/catalog";
import {
  createCashfreeOrder,
  cashfreeConfigured,
  cashfreeAppId,
  cashfreeMode,
  fetchCashfreeOrderPayments,
  findSuccessfulPayment,
} from "@/lib/cashfree";
import { markOrderPaid } from "@/lib/orders";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.is_blocked) return NextResponse.json({ error: "This account is unavailable." }, { status: 403 });

  const limit = rateLimit(`retry-payment:${user.id}`, 6, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ error: "Order reference missing." }, { status: 400 });

  const order = await getOrderForUser(body.orderId, user.id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.payment_method !== "online") {
    return NextResponse.json({ error: "This order is a cash-on-delivery order." }, { status: 400 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "This order is already paid." }, { status: 400 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "This order has been cancelled." }, { status: 400 });
  }
  if (!cashfreeConfigured()) {
    if (!isSupabaseConfigured()) {
      await markOrderPaid({
        orderId: order.id,
        gatewayPaymentId: `demo_retry_${Date.now()}`,
      });
      return NextResponse.json({ ok: true, simulated: true });
    }
    return NextResponse.json(
      {
        error: "Online payments are temporarily unavailable.",
      },
      { status: 400 },
    );
  }

  try {
    // If an earlier attempt already succeeded (for example the browser closed
    // before confirmation), reconcile it instead of charging the customer again.
    if (isSupabaseConfigured()) {
      const admin = createAdminSupabase();
      const { data: existingRow } = await admin
        .from("payments")
        .select("gateway_order_id")
        .eq("order_id", order.id)
        .eq("gateway", "cashfree")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const existingGatewayOrderId = existingRow?.gateway_order_id || order.order_number;
      const existingPayments = await fetchCashfreeOrderPayments(existingGatewayOrderId);
      const success = findSuccessfulPayment(existingPayments);
      if (success) {
        const reconciled = await markOrderPaid({
          orderId: order.id,
          gatewayOrderId: existingGatewayOrderId,
          gatewayPaymentId: success.cf_payment_id,
          amountInPaise: Math.round(Number(success.order_amount) * 100),
          rawPayload: {
            id: success.cf_payment_id,
            status: success.payment_status,
            amount: success.payment_amount ?? success.order_amount,
          },
        });
        if (reconciled.ok) return NextResponse.json({ ok: true, alreadyPaid: true });
      }
    }

    // Cashfree rejects a duplicate merchant order id, so give each retry a
    // unique reference while keeping the store order number in the notes.
    const retryOrderId = `${order.order_number}-R${Date.now().toString(36).toUpperCase()}`;
    const cashfree = await createCashfreeOrder({
      amount: order.total,
      currency: "INR",
      customerDetails: {
        id: user.id,
        email: user.email,
        phone: order.address.phone,
        name: order.address.name,
      },
      orderId: retryOrderId,
      notes: { order_number: order.order_number, user_id: user.id, retry: "true" },
    });
    if (isSupabaseConfigured()) {
      const admin = createAdminSupabase();
      const { data: existing } = await admin
        .from("payments")
        .select("id")
        .eq("order_id", order.id)
        .eq("gateway", "cashfree")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        await admin
          .from("payments")
          .update({ gateway_order_id: cashfree.order_id, status: "created" })
          .eq("id", existing.id);
      } else {
        await admin.from("payments").insert({
          order_id: order.id,
          gateway: "cashfree",
          gateway_order_id: cashfree.order_id,
          status: "created",
        });
      }
    }
    const settings = await getSettings();
    return NextResponse.json({
      handoff: {
        appId: cashfreeAppId(),
        mode: cashfreeMode(),
        paymentSessionId: cashfree.payment_session_id,
        gatewayOrderId: cashfree.order_id,
        amount: cashfree.order_amount,
        customerEmail: user.email,
        customerPhone: order.address.phone,
        customerName: order.address.name,
        storeName: settings.store_name,
        description: `Leaf & Pot order ${order.order_number}`,
      },
    });
  } catch (error) {
    console.error("[retry-payment] failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 500 });
  }
}
