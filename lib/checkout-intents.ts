import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { getOrderForUserAdmin } from "@/lib/catalog";
import {
  cashfreeAppId,
  cashfreeConfigured,
  cashfreeDiagnostics,
  cashfreeMode,
  createCashfreeOrder,
  fetchCashfreeOrderPayments,
  findSuccessfulPayment,
} from "@/lib/cashfree";
import { markOrderPaid, notifyAdminsOfNewOrder, prepareCheckout } from "@/lib/orders";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { AddressSnapshot, CartTotals, Order, User } from "@/lib/types";
import type { CheckoutInput } from "@/lib/validation";

/**
 * Online checkout uses a durable "intent" instead of creating an order before
 * payment. The validated cart, address and totals are signed and stored in the
 * notifications table (user-scoped, already RLS-protected) so no schema
 * migration is required. The real order is only created by the completion
 * endpoint or the Cashfree webhook after a verified successful payment.
 */

const PENDING = "checkout_intent";
const PROCESSING = "checkout_intent_processing";
const COMPLETED = "checkout_intent_completed";
const FAILED = "checkout_intent_failed";
const INTENT_TYPES = [PENDING, PROCESSING, COMPLETED, FAILED] as const;

/** Cashfree payment sessions expire in 15 minutes; keep the intent a little longer. */
const INTENT_TTL_MS = 30 * 60 * 1000;
/** A crashed finalizer can be safely retried after this window. */
const STALE_CLAIM_MS = 2 * 60 * 1000;

export interface CheckoutIntentPayload {
  v: 1;
  userId: string;
  reference: string;
  input: CheckoutInput;
  address: AddressSnapshot;
  totals: CartTotals;
  amountInPaise: number;
  loyaltyPoints: number;
  createdAt: string;
  expiresAt: string;
}

interface IntentBody extends CheckoutIntentPayload {
  sig: string;
  claimedAt?: string;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

interface IntentRow {
  rowId: string;
  userId: string;
  type: string;
  payload: CheckoutIntentPayload;
  body: IntentBody;
  rawBody: string;
  claimedAt?: string;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export interface CheckoutPaymentInfo {
  gatewayPaymentId: string;
  amountInPaise: number;
  rawPayload?: Record<string, unknown>;
}

export type StartOnlineCheckoutResult =
  | {
      ok: true;
      checkoutReference: string;
      total: number;
      cashfree: {
        appId: string;
        mode: string;
        paymentSessionId: string;
        gatewayOrderId: string;
        amount: number;
        customerEmail: string;
        customerPhone: string;
        customerName: string;
        storeName: string;
        description: string;
      };
    }
  | { ok: false; error: string };

export type CompleteOnlineCheckoutResult =
  | { ok: true; order: Order }
  | {
      ok: false;
      error: string;
      /** Payment may still clear; the client should poll the completion endpoint. */
      pending?: boolean;
      /** It is safe to start a fresh payment attempt (no captured payment known). */
      retryable?: boolean;
      status?: number;
    };

/* -------------------------------------------------------------------------- */
/*  Signed intent storage                                                      */
/* -------------------------------------------------------------------------- */

function intentSecret() {
  const secret =
    process.env.CHECKOUT_INTENT_SECRET ||
    process.env.CASHFREE_WEBHOOK_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Checkout intent secret is not configured.");
  return secret;
}

function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function signBody(body: Omit<IntentBody, "sig">) {
  return createHmac("sha256", intentSecret()).update(JSON.stringify(body)).digest("hex");
}

function withSignature(body: Omit<IntentBody, "sig">): IntentBody {
  return { ...body, sig: signBody(body) };
}

function verifyBody(body: IntentBody) {
  if (!body?.sig) return false;
  const { sig, ...rest } = body;
  return safeEqual(signBody(rest as Omit<IntentBody, "sig">), sig);
}

function payloadFromBody(body: IntentBody): CheckoutIntentPayload {
  return {
    v: body.v,
    userId: body.userId,
    reference: body.reference,
    input: body.input,
    address: body.address,
    totals: body.totals,
    amountInPaise: body.amountInPaise,
    loyaltyPoints: body.loyaltyPoints,
    createdAt: body.createdAt,
    expiresAt: body.expiresAt,
  };
}

async function getIntentRows(reference: string, userId?: string): Promise<IntentRow[]> {
  const admin = createAdminSupabase();
  let query = admin
    .from("notifications")
    .select("id, user_id, type, title, body, created_at")
    .eq("title", reference)
    .in("type", [...INTENT_TYPES])
    .order("created_at", { ascending: false })
    .limit(5);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error || !data) return [];

  const rows: IntentRow[] = [];
  for (const raw of data) {
    let body: IntentBody;
    try {
      body = JSON.parse(String(raw.body)) as IntentBody;
    } catch {
      continue;
    }
    if (!verifyBody(body)) continue;
    if (body.reference !== reference) continue;
    if (userId && body.userId !== userId) continue;
    if (String(raw.user_id) !== body.userId) continue;
    rows.push({
      rowId: String(raw.id),
      userId: body.userId,
      type: String(raw.type),
      payload: payloadFromBody(body),
      body,
      rawBody: String(raw.body),
      claimedAt: body.claimedAt,
      orderId: body.orderId,
      orderNumber: body.orderNumber,
      error: body.error,
    });
  }
  return rows;
}

async function getIntent(reference: string, userId?: string) {
  const rows = await getIntentRows(reference, userId);
  return rows[0] ?? null;
}

async function cleanupOldIntents(userId: string) {
  try {
    const admin = createAdminSupabase();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .in("type", [...INTENT_TYPES])
      .lt("created_at", cutoff);
  } catch (error) {
    console.error("[checkout] intent cleanup failed", error instanceof Error ? error.message : "unknown");
  }
}

/* -------------------------------------------------------------------------- */
/*  Start checkout                                                             */
/* -------------------------------------------------------------------------- */

export async function startOnlineCheckout(
  user: User,
  input: CheckoutInput,
): Promise<StartOnlineCheckoutResult> {
  if (!cashfreeConfigured()) {
    console.error("[cashfree] missing configuration", cashfreeDiagnostics());
    return {
      ok: false,
      error: "Online payments are temporarily unavailable. Please choose cash on delivery.",
    };
  }

  const prepared = await prepareCheckout(user, input);
  if (!prepared.ok) return prepared;

  const reference = `CHK-${Date.now().toString(36).toUpperCase()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

  let cashfreeOrder;
  try {
    cashfreeOrder = await createCashfreeOrder({
      amount: prepared.totals.total,
      currency: "INR",
      customerDetails: {
        id: user.id,
        email: user.email,
        phone: prepared.address.phone,
        name: user.full_name,
      },
      orderId: reference,
      notes: { user_id: user.id, checkout: "1" },
    });
  } catch (error) {
    console.error("[checkout] cashfree order failed", {
      ...cashfreeDiagnostics(),
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      error: "We couldn't start the online payment. Please try again or choose cash on delivery.",
    };
  }

  const payload: CheckoutIntentPayload = {
    v: 1,
    userId: user.id,
    reference: cashfreeOrder.order_id,
    input,
    address: prepared.address,
    totals: prepared.totals,
    amountInPaise: Math.round(prepared.totals.total * 100),
    loyaltyPoints: input.use_loyalty ? user.loyalty_points : 0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + INTENT_TTL_MS).toISOString(),
  };

  try {
    const admin = createAdminSupabase();
    const body = withSignature(payload);
    const { error } = await admin.from("notifications").insert({
      user_id: user.id,
      type: PENDING,
      title: payload.reference,
      body: JSON.stringify(body),
      is_read: true,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error(
      "[checkout] intent save failed",
      error instanceof Error ? error.message : "unknown",
    );
    return { ok: false, error: "We couldn't save your checkout. Please try again." };
  }

  void cleanupOldIntents(user.id);

  return {
    ok: true,
    checkoutReference: payload.reference,
    total: prepared.totals.total,
    cashfree: {
      appId: cashfreeAppId(),
      mode: cashfreeMode(),
      paymentSessionId: cashfreeOrder.payment_session_id,
      gatewayOrderId: cashfreeOrder.order_id,
      amount: cashfreeOrder.order_amount,
      customerEmail: user.email,
      customerPhone: prepared.address.phone,
      customerName: user.full_name,
      storeName: prepared.settings.store_name,
      description: `Leaf & Pot checkout ${payload.reference}`,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Completion                                                                 */
/* -------------------------------------------------------------------------- */

export async function completeOnlineCheckout(
  user: User,
  reference: string,
): Promise<CompleteOnlineCheckoutResult> {
  const intent = await getIntent(reference, user.id);
  if (!intent) {
    return {
      ok: false,
      retryable: true,
      status: 404,
      error: "We couldn't find that checkout. Please start again.",
    };
  }

  if (intent.type === COMPLETED) {
    const order = intent.orderId ? await getOrderForUserAdmin(intent.orderId) : null;
    if (order) return { ok: true, order };
    return { ok: false, status: 404, error: "The order could not be loaded." };
  }
  if (intent.type === FAILED) {
    return {
      ok: false,
      status: 409,
      error: intent.error ?? "We couldn't complete this order. Please contact support.",
    };
  }
  if (intent.type === PROCESSING && !isStale(intent)) {
    return {
      ok: false,
      pending: true,
      status: 202,
      error: "We're still confirming this payment.",
    };
  }

  const payments = await fetchCashfreeOrderPayments(reference);
  const success = findSuccessfulPayment(payments);
  if (!success) {
    if (new Date(intent.payload.expiresAt).getTime() < Date.now()) {
      return {
        ok: false,
        retryable: true,
        status: 410,
        error: "This checkout session has expired. Please start again.",
      };
    }
    return {
      ok: false,
      pending: true,
      status: 402,
      error: "Payment confirmation is still processing.",
    };
  }

  const amountInPaise = Math.round(Number(success.order_amount) * 100);
  return finalizeIntent(intent, {
    gatewayPaymentId: success.cf_payment_id,
    amountInPaise,
    rawPayload: success as unknown as Record<string, unknown>,
  });
}

/** Webhook fallback: finalize an intent when the browser closed after paying. */
export async function finalizeCheckoutIntentByReference(
  reference: string,
  payment: CheckoutPaymentInfo,
): Promise<CompleteOnlineCheckoutResult | { ok: false; notFound: true; error: string }> {
  const intent = await getIntent(reference);
  if (!intent) return { ok: false, notFound: true, error: "Checkout intent not found." };

  if (intent.type === COMPLETED) {
    const order = intent.orderId ? await getOrderForUserAdmin(intent.orderId) : null;
    if (order) return { ok: true, order };
    return { ok: false, notFound: true, error: "Order not found." };
  }
  if (intent.type === FAILED) {
    return {
      ok: false,
      status: 409,
      error: intent.error ?? "This checkout could not be completed.",
    };
  }
  if (intent.type === PROCESSING && !isStale(intent)) {
    return { ok: false, pending: true, status: 202, error: "Checkout is being finalized." };
  }

  return finalizeIntent(intent, payment);
}

function isStale(intent: IntentRow) {
  if (intent.type !== PROCESSING) return false;
  if (!intent.claimedAt) return true;
  return Date.now() - new Date(intent.claimedAt).getTime() > STALE_CLAIM_MS;
}

async function claimIntent(
  intent: IntentRow,
): Promise<{ claimed: boolean; claimedAt: string; rawBody: string }> {
  const admin = createAdminSupabase();
  const claimedAt = new Date().toISOString();
  const body = withSignature({ ...intent.payload, claimedAt });
  const rawBody = JSON.stringify(body);
  const { data } = await admin
    .from("notifications")
    .update({ type: PROCESSING, body: rawBody })
    .eq("id", intent.rowId)
    .eq("type", intent.type)
    .eq("body", intent.rawBody)
    .select("id")
    .maybeSingle();
  return { claimed: Boolean(data), claimedAt, rawBody };
}

async function resetIntent(intent: IntentRow, claimedRawBody?: string) {
  try {
    const admin = createAdminSupabase();
    const body = withSignature(intent.payload);
    let query = admin
      .from("notifications")
      .update({ type: PENDING, body: JSON.stringify(body) })
      .eq("id", intent.rowId)
      .eq("type", PROCESSING);
    if (claimedRawBody) query = query.eq("body", claimedRawBody);
    await query;
  } catch (error) {
    console.error("[checkout] intent reset failed", error instanceof Error ? error.message : "unknown");
  }
}

async function completeIntent(intent: IntentRow, order: Order, claimedAt: string) {
  try {
    const admin = createAdminSupabase();
    const body = withSignature({
      ...intent.payload,
      claimedAt,
      orderId: order.id,
      orderNumber: order.order_number,
    });
    await admin
      .from("notifications")
      .update({ type: COMPLETED, body: JSON.stringify(body) })
      .eq("id", intent.rowId)
      .eq("type", PROCESSING);
  } catch (error) {
    console.error(
      "[checkout] intent completion failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}

async function failIntent(intent: IntentRow, message: string, claimedAt?: string) {
  try {
    const admin = createAdminSupabase();
    const body = withSignature({
      ...intent.payload,
      claimedAt: claimedAt ?? new Date().toISOString(),
      error: message,
    });
    await admin
      .from("notifications")
      .update({ type: FAILED, body: JSON.stringify(body) })
      .eq("id", intent.rowId)
      .in("type", [PENDING, PROCESSING]);

    await admin.from("notifications").insert({
      user_id: intent.payload.userId,
      type: "order",
      title: "Payment received — we need a moment",
      body: `We received your payment (reference ${intent.payload.reference}) but couldn't create the order automatically. Our team will contact you with the next steps.`,
    });
  } catch (error) {
    console.error("[checkout] intent failure update failed", error instanceof Error ? error.message : "unknown");
  }
}

function friendlyOrderError(message: string) {
  if (message.includes("OUT_OF_STOCK")) return message.replace("OUT_OF_STOCK:", "").trim();
  if (message.includes("COUPON")) return message.replace("COUPON:", "").trim();
  if (message.includes("LOYALTY")) return message.replace("LOYALTY:", "").trim();
  if (message.includes("ACCOUNT_BLOCKED")) return "This account is unavailable.";
  return "";
}

async function saveIntentAddress(payload: CheckoutIntentPayload) {
  const input = payload.input;
  if (!input.address || input.address_id || input.save_address === false) return;
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("addresses")
    .select("id")
    .eq("user_id", payload.userId)
    .eq("line1", input.address.line1)
    .eq("pincode", input.address.pincode)
    .limit(1)
    .maybeSingle();
  if (existing) return;
  const { count } = await admin
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", payload.userId);
  await admin.from("addresses").insert({
    user_id: payload.userId,
    name: input.address.name,
    phone: input.address.phone,
    line1: input.address.line1,
    line2: input.address.line2 || null,
    city: input.address.city,
    state: input.address.state,
    pincode: input.address.pincode,
    is_default: (count ?? 0) === 0,
  });
}

async function finalizeIntent(
  intent: IntentRow,
  payment: CheckoutPaymentInfo,
): Promise<CompleteOnlineCheckoutResult> {
  const claim = await claimIntent(intent);
  if (!claim.claimed) {
    const latest = await getIntent(intent.payload.reference);
    if (!latest) {
      return { ok: false, status: 404, error: "We couldn't find that checkout." };
    }
    if (latest.type === COMPLETED) {
      const order = latest.orderId ? await getOrderForUserAdmin(latest.orderId) : null;
      if (order) return { ok: true, order };
      return { ok: false, status: 404, error: "The order could not be loaded." };
    }
    if (latest.type === FAILED) {
      return {
        ok: false,
        status: 409,
        error: latest.error ?? "We couldn't complete this order. Please contact support.",
      };
    }
    return { ok: false, pending: true, status: 202, error: "We're still confirming this payment." };
  }

  if (payment.amountInPaise !== intent.payload.amountInPaise) {
    await failIntent(intent, "The payment amount did not match the order total.", claim.claimedAt);
    return {
      ok: false,
      status: 409,
      error: "The payment amount didn't match the order total. Please contact support.",
    };
  }

  const admin = createAdminSupabase();

  // Idempotency: a previous attempt may already have created the order.
  const { data: existingPayment } = await admin
    .from("payments")
    .select("order_id, status")
    .eq("gateway", "cashfree")
    .eq("gateway_order_id", intent.payload.reference)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment?.order_id) {
    const existingOrder = await getOrderForUserAdmin(String(existingPayment.order_id));
    if (existingOrder) {
      if (existingOrder.payment_status !== "paid") {
        const paid = await markOrderPaid({
          orderId: existingOrder.id,
          gatewayOrderId: intent.payload.reference,
          gatewayPaymentId: payment.gatewayPaymentId,
          amountInPaise: payment.amountInPaise,
          rawPayload: payment.rawPayload,
        });
        if (!paid.ok) {
          await resetIntent(intent, claim.rawBody);
          return { ok: false, status: 500, error: paid.error ?? "Could not record the payment." };
        }
      }
      const refreshed = (await getOrderForUserAdmin(existingOrder.id)) ?? existingOrder;
      await completeIntent(intent, refreshed, claim.claimedAt);
      return { ok: true, order: refreshed };
    }
  }

  await saveIntentAddress(intent.payload).catch(() => undefined);

  const { data, error } = await admin.rpc("place_order", {
    p_user_id: intent.payload.userId,
    p_items: intent.payload.input.items.map((item) => ({ variant_id: item.variantId, qty: item.qty })),
    p_address: intent.payload.address,
    p_payment_method: "online",
    p_coupon_code: intent.payload.input.coupon_code || null,
    p_notes: intent.payload.input.notes || null,
    p_loyalty_points: intent.payload.loyaltyPoints,
  });

  if (error) {
    const rawMessage = error.message || "";
    const friendly = friendlyOrderError(rawMessage);
    if (friendly) {
      await failIntent(intent, friendly, claim.claimedAt);
      return { ok: false, status: 409, error: friendly };
    }
    console.error("[checkout] place_order from intent failed", rawMessage);
    await resetIntent(intent, claim.rawBody);
    return {
      ok: false,
      status: 500,
      error: "We couldn't create your order just now. Please try again.",
    };
  }

  const result = data as { order_id?: string; order_number?: string } | null;
  if (!result?.order_id) {
    await resetIntent(intent, claim.rawBody);
    return { ok: false, status: 500, error: "The order could not be confirmed." };
  }

  // Record a payment row immediately so a retry can find the order if the
  // process is interrupted before markOrderPaid finishes.
  await admin.from("payments").insert({
    order_id: result.order_id,
    gateway: "cashfree",
    gateway_order_id: intent.payload.reference,
    gateway_payment_id: payment.gatewayPaymentId,
    status: "created",
    amount: intent.payload.totals.total,
    raw_payload: payment.rawPayload ?? {},
  });

  const order = await getOrderForUserAdmin(result.order_id);
  if (!order) {
    await resetIntent(intent, claim.rawBody);
    return { ok: false, status: 500, error: "The order was created but could not be loaded." };
  }

  // The catalogue can change while the customer is paying. Never keep an order
  // whose total differs from the amount Cashfree captured.
  if (Math.round(Number(order.total) * 100) !== intent.payload.amountInPaise) {
    await admin.rpc("cancel_order", { p_order_id: order.id });
    await failIntent(intent, "The order total changed before payment was confirmed.", claim.claimedAt);
    return {
      ok: false,
      status: 409,
      error:
        "The order total changed before your payment was confirmed. Please contact support with your payment reference.",
    };
  }

  const paid = await markOrderPaid({
    orderId: order.id,
    gatewayOrderId: intent.payload.reference,
    gatewayPaymentId: payment.gatewayPaymentId,
    amountInPaise: payment.amountInPaise,
    rawPayload: payment.rawPayload,
  });
  if (!paid.ok) {
    await resetIntent(intent, claim.rawBody);
    return { ok: false, status: 500, error: paid.error ?? "Could not record the payment." };
  }

  const refreshed = (await getOrderForUserAdmin(order.id)) ?? order;
  void notifyAdminsOfNewOrder(refreshed);
  await completeIntent(intent, refreshed, claim.claimedAt);
  return { ok: true, order: refreshed };
}
