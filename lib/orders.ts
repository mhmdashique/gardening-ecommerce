import { getDb, nextOrderNumber } from "@/lib/demo-store";
import {
  getAddresses,
  getCouponByCode,
  getCustomerOrderCount,
  getDeliveryZone,
  getOrderForUser,
  getOrderForUserAdmin,
  getSettings,
  getVariantForCheckout,
} from "@/lib/catalog";
import { computeTotals } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createCashfreeOrder, cashfreeConfigured, cashfreeAppId, cashfreeMode } from "@/lib/cashfree";
import { sendOrderConfirmation } from "@/lib/email";
import type { AddressSnapshot, CartTotals, Coupon, Order, OrderItem, SiteSettings, User } from "@/lib/types";
import type { CheckoutInput } from "@/lib/validation";

export interface CashfreeHandoff {
  appId: string;
  /** "sandbox" or "production" — selects the Lite SDK checkout environment. */
  mode: string;
  /** Payment session token from the Cashfree order; opens the drop-in checkout. */
  paymentSessionId: string;
  /** Cashfree gateway order reference (uuid). */
  gatewayOrderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  storeName: string;
  description: string;
}

export type CreateOrderResult =
  | { ok: true; order: Order; cashfree?: CashfreeHandoff; simulatedPayment?: boolean }
  | { ok: false; error: string };

async function resolveAddress(
  user: User,
  input: CheckoutInput,
): Promise<{ address: AddressSnapshot; error?: string }> {
  if (input.address_id) {
    const addresses = await getAddresses(user.id);
    const existing = addresses.find((address) => address.id === input.address_id);
    if (!existing) return { address: {} as AddressSnapshot, error: "That delivery address could not be found." };
    return {
      address: {
        name: existing.name,
        phone: existing.phone,
        line1: existing.line1,
        line2: existing.line2,
        city: existing.city,
        state: existing.state,
        pincode: existing.pincode,
      },
    };
  }
  if (input.address) {
    return {
      address: {
        name: input.address.name,
        phone: input.address.phone,
        line1: input.address.line1,
        line2: input.address.line2 || null,
        city: input.address.city,
        state: input.address.state,
        pincode: input.address.pincode,
      },
    };
  }
  return { address: {} as AddressSnapshot, error: "Choose or add a delivery address." };
}

async function saveNewAddress(user: User, input: CheckoutInput) {
  if (!input.address || input.address_id || input.save_address === false) return;
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const existing = await getAddresses(user.id);
    await supabase.from("addresses").insert({
      user_id: user.id,
      name: input.address.name,
      phone: input.address.phone,
      line1: input.address.line1,
      line2: input.address.line2 || null,
      city: input.address.city,
      state: input.address.state,
      pincode: input.address.pincode,
      is_default: existing.length === 0,
    });
    return;
  }
  const db = getDb();
  if (!db.addresses.some((address) => address.user_id === user.id)) {
    db.addresses.push({
      id: `a-${Date.now()}`,
      user_id: user.id,
      name: input.address.name,
      phone: input.address.phone,
      line1: input.address.line1,
      line2: input.address.line2 || null,
      city: input.address.city,
      state: input.address.state,
      pincode: input.address.pincode,
      is_default: true,
    });
  }
}

function notifyDemo(userId: string, title: string, body: string, type = "order") {
  getDb().notifications.unshift({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    type,
    title,
    body,
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

/**
 * Pings every admin ("notifications" bell in the command center) that a new
 * order just arrived. Fire-and-forget safe: failures never block checkout.
 */
export async function notifyAdminsOfNewOrder(order: Order): Promise<void> {
  const title = `New order ${order.order_number}`;
  const body = `${order.customer_name} placed a ${order.payment_method === "cod" ? "cash-on-delivery" : "online"} order.`;
  try {
    if (isSupabaseConfigured()) {
      const admin = createAdminSupabase();
      const { data: adminUsers } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .eq("is_blocked", false);
      const targets = (adminUsers ?? []).map((row) => String(row.id)).filter((id) => id !== order.user_id);
      if (!targets.length) return;
      const { error } = await admin
        .from("notifications")
        .insert(targets.map((id) => ({ user_id: id, type: "admin_order", title, body })));
      if (error) console.error("[orders] admin notification insert failed", error.message);
    } else {
      const db = getDb();
      for (const adminUser of db.users.filter((entry) => entry.role === "admin")) {
        notifyDemo(adminUser.id, title, body, "admin_order");
      }
    }
  } catch (error) {
    console.error("[orders] admin notification failed", error instanceof Error ? error.message : error);
  }
}

export type PreparedCheckout =
  | {
      ok: true;
      address: AddressSnapshot;
      totals: CartTotals;
      settings: SiteSettings;
      coupon: Coupon | null;
    }
  | { ok: false; error: string };

/**
 * Server-side validation shared by the COD and online checkout flows.
 * It re-prices the bag from the catalogue and returns the authoritative total
 * that will be charged. No order is written here.
 */
export async function prepareCheckout(user: User, input: CheckoutInput): Promise<PreparedCheckout> {
  const settings = await getSettings();
  if (input.payment_method === "cod" && !settings.cod_enabled) {
    return { ok: false, error: "Cash on delivery is currently unavailable." };
  }
  if (input.payment_method === "online" && !settings.online_payment_enabled) {
    return { ok: false, error: "Online payments are currently unavailable. Please choose cash on delivery." };
  }

  const { address, error: addressError } = await resolveAddress(user, input);
  if (addressError) return { ok: false, error: addressError };

  // Aggregate duplicate variants.
  const wanted = new Map<string, number>();
  for (const item of input.items) {
    wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.qty);
  }

  const resolved: Awaited<ReturnType<typeof getVariantForCheckout>>[] = [];
  for (const [variantId, qty] of wanted) {
    const variant = await getVariantForCheckout(variantId);
    if (!variant) return { ok: false, error: "One of the items in your bag is no longer available." };
    if (qty > variant.stock) {
      return {
        ok: false,
        error: `${variant.name} (${variant.size}) only has ${variant.stock} left. Please update your bag.`,
      };
    }
    resolved.push(variant);
  }
  const validItems = resolved.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const zone = await getDeliveryZone(address.pincode);

  const coupon = input.coupon_code ? await getCouponByCode(input.coupon_code) : null;
  if (input.coupon_code && !coupon) return { ok: false, error: "That coupon code is not valid." };
  const orderCount = await getCustomerOrderCount(user.id);
  const totals: CartTotals = computeTotals({
    lines: validItems.map((item) => ({
      price: item.price,
      qty: wanted.get(item.variantId) ?? 1,
      categoryId: item.categoryId,
    })),
    settings,
    coupon,
    zoneCharge: zone.charge,
    loyaltyPointsToRedeem: input.use_loyalty ? user.loyalty_points : 0,
    loyaltyPointsBalance: user.loyalty_points,
    isFirstOrder: orderCount === 0,
  });
  if (totals.couponError) return { ok: false, error: totals.couponError };

  return { ok: true, address, totals, settings, coupon };
}

async function demoCreateOrder(user: User, input: CheckoutInput): Promise<CreateOrderResult> {
  const { address, error: addressError } = await resolveAddress(user, input);
  if (addressError) return { ok: false, error: addressError };

  const settings = await getSettings();
  if (input.payment_method === "cod" && !settings.cod_enabled) {
    return { ok: false, error: "Cash on delivery is currently unavailable." };
  }

  // Aggregate duplicate variants.
  const wanted = new Map<string, number>();
  for (const item of input.items) {
    wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.qty);
  }

  const resolved: Awaited<ReturnType<typeof getVariantForCheckout>>[] = [];
  for (const [variantId, qty] of wanted) {
    const variant = await getVariantForCheckout(variantId);
    if (!variant) return { ok: false, error: "One of the items in your bag is no longer available." };
    if (qty > variant.stock) {
      return { ok: false, error: `${variant.name} (${variant.size}) only has ${variant.stock} left. Please update your bag.` };
    }
    resolved.push({ ...variant, stock: variant.stock });
  }
  const validItems = resolved.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const zone = await getDeliveryZone(address.pincode);

  const coupon = input.coupon_code ? await getCouponByCode(input.coupon_code) : null;
  if (input.coupon_code && !coupon) return { ok: false, error: "That coupon code is not valid." };
  const orderCount = await getCustomerOrderCount(user.id);
  const totals: CartTotals = computeTotals({
    lines: validItems.map((item) => ({ price: item.price, qty: wanted.get(item.variantId) ?? 1, categoryId: item.categoryId })),
    settings,
    coupon,
    zoneCharge: zone.charge,
    loyaltyPointsToRedeem: input.use_loyalty ? user.loyalty_points : 0,
    loyaltyPointsBalance: user.loyalty_points,
    isFirstOrder: orderCount === 0,
  });
  if (totals.couponError) return { ok: false, error: totals.couponError };

  const db = getDb();
  const orderId = `o-${Date.now()}`;
  const orderNumber = nextOrderNumber();
  const createdAt = new Date().toISOString();
  const orderItems: OrderItem[] = validItems.map((item, index) => ({
    id: `${orderId}-i${index + 1}`,
    order_id: orderId,
    variant_id: item.variantId,
    product_id: item.productId,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    image: item.image,
    size: item.size,
    pot_type: item.potType,
    price: item.price,
    qty: wanted.get(item.variantId) ?? 1,
  }));

  // Demo stock decrement is synchronous and re-checked immediately before writing.
  for (const item of validItems) {
    const qty = wanted.get(item.variantId) ?? 1;
    for (const product of db.products) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) continue;
      if (variant.stock < qty) return { ok: false, error: `${item.name} just sold out. Please update your bag.` };
      variant.stock -= qty;
    }
  }

  const online = input.payment_method === "online";
  const simulated = online && !cashfreeConfigured();
  const order: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: user.id,
    customer_name: user.full_name,
    customer_email: user.email,
    status: "processing",
    payment_method: input.payment_method,
    payment_status: online ? (simulated ? "paid" : "pending") : "cod_pending",
    subtotal: totals.subtotal,
    discount: totals.discount,
    loyalty_discount: totals.loyaltyDiscount,
    delivery_charge: totals.deliveryCharge,
    gst: totals.gst,
    total: totals.total,
    loyalty_points_earned: settings.loyalty_enabled ? totals.loyaltyPointsEarned : 0,
    loyalty_points_used: totals.loyaltyPointsUsed,
    address,
    coupon_code: coupon?.code ?? null,
    tracking_number: null,
    courier: null,
    notes: input.notes ?? null,
    created_at: createdAt,
    updated_at: createdAt,
    items: orderItems,
    status_history: [
      {
        id: `${orderId}-h1`,
        status: "processing",
        note: "Order placed successfully.",
        changed_by: "system",
        created_at: createdAt,
      },
    ],
    invoice_number: `INV-${orderNumber}`,
  };

  db.orders.unshift(order);
  if (totals.loyaltyPointsUsed > 0) {
    user.loyalty_points = Math.max(0, user.loyalty_points - totals.loyaltyPointsUsed);
    db.loyalty.push({
      id: `lt-${Date.now()}-u`,
      user_id: user.id,
      order_id: order.id,
      points: -totals.loyaltyPointsUsed,
      type: "redeemed",
      note: `Redeemed on ${orderNumber}`,
      created_at: createdAt,
    });
  }
  if (coupon) {
    const storedCoupon = db.coupons.find((entry) => entry.id === coupon.id);
    if (storedCoupon) storedCoupon.used_count += 1;
  }
  await saveNewAddress(user, input);
  notifyDemo(
    user.id,
    "Order confirmed",
    `${orderNumber} is confirmed. We'll let you know as soon as your plants are packed.`,
  );
  void notifyAdminsOfNewOrder(order);

  if (simulated) await awardLoyaltyForOrder(order.id);

  if (input.payment_method === "cod") {
    await sendOrderConfirmation(order).catch(() => undefined);
  }

  if (online && cashfreeConfigured()) {
    try {
      const cf = await createCashfreeOrder({
        amount: order.total,
        currency: "INR",
        customerDetails: {
          id: user.id,
          email: user.email,
          phone: address.phone,
          name: user.full_name,
        },
        orderId: orderNumber,
        notes: { order_number: orderNumber, user_id: user.id },
      });
      return {
        ok: true,
        order,
        cashfree: {
          appId: cashfreeAppId(),
          mode: cashfreeMode(),
          paymentSessionId: cf.payment_session_id,
          gatewayOrderId: cf.order_id,
          amount: cf.order_amount,
          customerEmail: user.email,
          customerPhone: address.phone,
          customerName: user.full_name,
          storeName: settings.store_name,
          description: `Leaf & Pot order ${orderNumber}`,
        },
      };
    } catch (error) {
      order.payment_status = "failed";
      return { ok: false, error: error instanceof Error ? error.message : "Could not start online payment." };
    }
  }

  return { ok: true, order, simulatedPayment: simulated };
}

export async function createOrderForUser(user: User, input: CheckoutInput): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured()) {
    return demoCreateOrder(user, input);
  }

  // Online orders are created by the payment-completion flow only after
  // Cashfree confirms the payment. This path is reserved for COD.
  if (input.payment_method === "online") {
    return { ok: false, error: "Online orders are confirmed after payment. Please use the secure payment flow." };
  }

  const settings = await getSettings();
  if (!settings.cod_enabled) {
    return { ok: false, error: "Cash on delivery is currently unavailable." };
  }

  const { address, error: addressError } = await resolveAddress(user, input);
  if (addressError) return { ok: false, error: addressError };
  await saveNewAddress(user, input);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("place_order", {
    p_user_id: user.id,
    p_items: input.items.map((item) => ({ variant_id: item.variantId, qty: item.qty })),
    p_address: address,
    p_payment_method: input.payment_method,
    p_coupon_code: input.coupon_code || null,
    p_notes: input.notes || null,
    p_loyalty_points: input.use_loyalty ? user.loyalty_points : 0,
  });

  if (error) {
    const message = error.message || "";
    if (message.includes("OUT_OF_STOCK")) return { ok: false, error: message.replace("OUT_OF_STOCK:", "").trim() };
    if (message.includes("COUPON")) return { ok: false, error: message.replace("COUPON:", "").trim() };
    if (message.includes("LOYALTY")) return { ok: false, error: message.replace("LOYALTY:", "").trim() };
    console.error("[checkout] place_order failed", message);
    return { ok: false, error: "We couldn't place your order. Please review your bag and try again." };
  }

  const result = data as { order_id?: string; order_number?: string } | null;
  if (!result?.order_id) return { ok: false, error: "The order could not be confirmed." };
  const order = await getOrderForUser(result.order_id, user.id);
  if (!order) return { ok: false, error: "The order was created but could not be loaded. Check your orders." };

  await sendOrderConfirmation(order).catch(() => undefined);
  const admin = createAdminSupabase();
  await admin.from("notifications").insert({
    user_id: user.id,
    type: "order",
    title: "Order confirmed",
    body: `${order.order_number} is confirmed. We'll let you know as soon as your plants are packed.`,
  });
  void notifyAdminsOfNewOrder(order);
  return { ok: true, order };
}

/**
 * Releases inventory, coupon usage and loyalty for a demo order that will no longer be fulfilled.
 * Safe to call more than once for the same order because stock is only released by the caller once.
 */
export function releaseDemoOrder(order: Order, reason: string) {
  const db = getDb();
  for (const item of order.items) {
    for (const product of db.products) {
      const variant = product.variants.find((entry) => entry.id === item.variant_id);


      if (variant) variant.stock += item.qty;
    }
  }
  if (order.coupon_code) {
    const coupon = db.coupons.find((entry) => entry.code === order.coupon_code);
    if (coupon) coupon.used_count = Math.max(0, coupon.used_count - 1);
  }
  if (order.loyalty_points_used > 0) {
    const redeemed = db.loyalty.find(
      (entry) => entry.order_id === order.id && entry.type === "redeemed" && entry.points < 0,
    );
    if (redeemed) {
      db.loyalty.push({
        id: `lt-${Date.now()}-ur`,
        user_id: order.user_id,
        order_id: order.id,
        points: order.loyalty_points_used,
        type: "adjusted",
        note: `Points returned after cancellation of ${order.order_number}`,
        created_at: new Date().toISOString(),
      });
      const user = db.users.find((entry) => entry.id === order.user_id);
      if (user) user.loyalty_points += order.loyalty_points_used;
    }
  }
  if (order.loyalty_points_earned > 0) {
    const earned = db.loyalty.find(
      (entry) => entry.order_id === order.id && entry.type === "earned" && entry.points > 0,
    );
    if (earned) {
      db.loyalty.push({
        id: `lt-${Date.now()}-r`,
        user_id: order.user_id,
        order_id: order.id,
        points: -earned.points,
        type: "adjusted",
        note: `Reversed after cancellation of ${order.order_number}`,
        created_at: new Date().toISOString(),
      });
      const user = db.users.find((entry) => entry.id === order.user_id);
      if (user) user.loyalty_points = Math.max(0, user.loyalty_points - earned.points);
    }
  }
  if (order.payment_status === "paid") order.payment_status = "refunded";
  order.updated_at = new Date().toISOString();
  order.status_history.push({
    id: `h-${Date.now()}-c`,
    status: "cancelled",
    note: reason,
    changed_by: "system",
    created_at: new Date().toISOString(),
  });
}

export async function awardLoyaltyForOrder(orderId: string) {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = await admin.rpc("award_loyalty", { p_order_id: orderId });
    if (error) console.error("[loyalty] award failed", error.message);
    return;
  }
  const db = getDb();
  const order = db.orders.find((entry) => entry.id === orderId);
  if (!order || order.loyalty_points_earned <= 0) return;
  if (db.loyalty.some((txn) => txn.order_id === order.id && txn.type === "earned")) return;
  db.loyalty.push({
    id: `lt-${Date.now()}`,
    user_id: order.user_id,
    order_id: order.id,
    points: order.loyalty_points_earned,
    type: "earned",
    note: `Earned on ${order.order_number}`,
    created_at: new Date().toISOString(),
  });
  const user = db.users.find((entry) => entry.id === order.user_id);
  if (user) user.loyalty_points += order.loyalty_points_earned;
}

/** Marks an order paid after successful Cashfree verification or webhook. Idempotent. */
export async function markOrderPaid(params: {
  orderId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId: string;
  rawPayload?: Record<string, unknown>;
  amountInPaise?: number;
}): Promise<{ ok: boolean; alreadyProcessed?: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const db = getDb();
    const order = db.orders.find(
      (entry) =>
        entry.id === params.orderId ||
        entry.id === params.gatewayOrderId ||
        (params.gatewayOrderId ? entry.order_number === params.gatewayOrderId : false),
    );
    if (!order) return { ok: false, error: "Order not found." };
    if (order.payment_status === "paid") return { ok: true, alreadyProcessed: true };
    if (params.amountInPaise && Math.round(order.total * 100) !== params.amountInPaise) {
      return { ok: false, error: "Payment amount mismatch." };
    }
    order.payment_status = "paid";
    order.updated_at = new Date().toISOString();
    order.status_history.push({
      id: `h-${Date.now()}`,
      status: "processing",
      note: `Payment captured (${params.gatewayPaymentId}).`,
      changed_by: "cashfree",
      created_at: new Date().toISOString(),
    });
    await awardLoyaltyForOrder(order.id);
    notifyDemo(order.user_id, "Payment received", `We've received payment for ${order.order_number}.`);
    await sendOrderConfirmation(order).catch(() => undefined);
    return { ok: true };
  }

  const admin = createAdminSupabase();
  let resolvedOrderId = params.orderId;
  if (!resolvedOrderId && params.gatewayOrderId) {
    const { data: paymentRow } = await admin
      .from("payments")
      .select("order_id")
      .eq("gateway_order_id", params.gatewayOrderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    resolvedOrderId = paymentRow?.order_id as string | undefined;

    // Older payment rows were saved without the gateway order id. Cashfree
    // orders use the merchant order number as their id, so fall back to it.
    if (!resolvedOrderId) {
      const { data: byNumber } = await admin
        .from("orders")
        .select("id")
        .eq("order_number", params.gatewayOrderId)
        .maybeSingle();
      resolvedOrderId = byNumber?.id as string | undefined;
    }
  }
  if (!resolvedOrderId) return { ok: false, error: "Order reference missing." };

  const orderQuery = admin
    .from("orders")
    .select("id, order_number, user_id, payment_status, total, payment_method")
    .eq("id", resolvedOrderId);
  const { data: order, error: orderError } = await orderQuery.maybeSingle();
  if (!order) {
    if (orderError) console.error("[orders] markOrderPaid lookup failed", orderError.message);
    return { ok: false, error: "Order not found." };
  }

  if (params.amountInPaise && Math.round(Number(order.total) * 100) !== params.amountInPaise) {
    return { ok: false, error: "Payment amount mismatch." };
  }

  const { data: payment } = await admin
    .from("payments")
    .select("id, status")
    .eq("order_id", order.id)
    .eq("gateway", "cashfree")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment && ["captured", "paid"].includes(String(payment.status)) && order.payment_status === "paid") {
    return { ok: true, alreadyProcessed: true };
  }

  if (payment) {
    const paymentUpdate: Record<string, unknown> = {
      gateway_payment_id: params.gatewayPaymentId,
      status: "captured",
      raw_payload: params.rawPayload ?? {},
    };
    if (params.gatewayOrderId) paymentUpdate.gateway_order_id = params.gatewayOrderId;
    const { error: paymentError } = await admin.from("payments").update(paymentUpdate).eq("id", payment.id);
    if (paymentError) {
      console.error("[orders] payment record update failed", paymentError.message);
      return { ok: false, error: "Could not record the payment." };
    }
  } else {
    const { error: paymentError } = await admin.from("payments").insert({
      order_id: order.id,
      gateway: "cashfree",
      gateway_order_id: params.gatewayOrderId ?? null,
      gateway_payment_id: params.gatewayPaymentId,
      status: "captured",
      raw_payload: params.rawPayload ?? {},
    });
    if (paymentError) {
      console.error("[orders] payment record insert failed", paymentError.message);
      return { ok: false, error: "Could not record the payment." };
    }
  }

  if (order.payment_status !== "paid") {
    const { error: orderError } = await admin.from("orders").update({ payment_status: "paid" }).eq("id", order.id);
    if (orderError) {
      console.error("[orders] payment status update failed", orderError.message);
      return { ok: false, error: "Could not update the order." };
    }
    await admin.from("order_status_history").insert({
      order_id: order.id,
      status: "processing",
      note: "Payment captured successfully.",
      changed_by: "cashfree",
    });
    await admin.from("notifications").insert({
      user_id: order.user_id,
      type: "order",
      title: "Payment received",
      body: `We've received payment for ${order.order_number}.`,
    });
    await awardLoyaltyForOrder(order.id);
  }

  const fullOrder = await getOrderForUserAdmin(order.id);
  if (fullOrder) await sendOrderConfirmation(fullOrder).catch(() => undefined);
  return { ok: true };
}
