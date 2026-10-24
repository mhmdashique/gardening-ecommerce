import { createHmac, timingSafeEqual } from "crypto";

/** Cashfree payment environment: "sandbox" (default) or "production". */
export function cashfreeMode(): "sandbox" | "production" {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function cashfreeBaseApiUrl() {
  return cashfreeMode() === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
}

const API_VERSION = "2023-08-01";

export function cashfreeConfigured() {
  return Boolean(
    process.env.CASHFREE_API_KEY &&
    process.env.CASHFREE_SECRET_KEY &&
    process.env.CASHFREE_APP_ID
  );
}

export function cashfreePublicKey() {
  return process.env.NEXT_PUBLIC_CASHFREE_API_KEY || process.env.CASHFREE_API_KEY || "";
}

export function cashfreeAppId() {
  return process.env.CASHFREE_APP_ID || "";
}

export interface CashfreeOrder {
  /** Cashfree's internal numeric order id. */
  cf_order_id: string;
  /** The merchant order id we supplied when creating the order. */
  order_id: string;
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
}

/**
 * Creates a Cashfree PG order and returns the payment session id needed by the
 * Lite JS SDK drop-in checkout.
 */
export async function createCashfreeOrder(params: {
  /** Amount in rupees (e.g. 499.00), not paise. */
  amount: number;
  currency: string;
  customerDetails: {
    id: string;
    email: string;
    phone: string;
    name: string;
  };
  orderId: string;
  notes?: Record<string, string>;
  returnUrl?: string;
}): Promise<CashfreeOrder> {
  const apiKey = process.env.CASHFREE_API_KEY;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const appId = process.env.CASHFREE_APP_ID;
  if (!apiKey || !secretKey || !appId) throw new Error("Cashfree is not configured.");

  const response = await fetch(`${cashfreeBaseApiUrl()}/pg/orders`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: Number(params.amount.toFixed(2)),
      order_currency: params.currency,
      customer_details: {
        customer_id: params.customerDetails.id,
        customer_name: params.customerDetails.name,
        customer_email: params.customerDetails.email,
        customer_phone: params.customerDetails.phone,
      },
      order_meta: params.returnUrl ? { return_url: params.returnUrl } : undefined,
      order_note: `Leaf & Pot ${params.orderId}`,
      order_tags: params.notes ?? {},
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Could not create the Cashfree order: ${error}`);
  }
  return (await response.json()) as CashfreeOrder;
}

/** Fetches an existing Cashfree order by its merchant order id. Returns null when it does not exist. */
export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrder | null> {
  const apiKey = process.env.CASHFREE_API_KEY;
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!apiKey || !appId || !secretKey) return null;

  const response = await fetch(`${cashfreeBaseApiUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "x-api-key": apiKey,
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": API_VERSION,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as CashfreeOrder;
}

export interface CashfreePayment {
  payment_id: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  payment_status: string;
  customer_details: {
    phone: string;
    email: string;
    name: string;
  };
  paid_amount: number;
  transaction_id?: string;
}

export interface CashfreeOrderPayment {
  cf_payment_id: string;
  order_id: string;
  order_currency: string;
  order_amount: number;
  payment_status: string;
  payment_amount?: number;
  payment_method?: { upi?: unknown; card?: unknown } | string;
  payment_time?: string;
}

/**
 * Fetches every payment attempt for a Cashfree order (id or uuid).
 * This is the authoritative source of truth — client callbacks are never trusted.
 */
export async function fetchCashfreeOrderPayments(orderId: string): Promise<CashfreeOrderPayment[]> {
  const apiKey = process.env.CASHFREE_API_KEY;
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!apiKey || !appId || !secretKey) return [];

  const response = await fetch(
    `${cashfreeBaseApiUrl()}/pg/orders/${encodeURIComponent(orderId)}/payments`,
    {
      headers: {
        "x-api-key": apiKey,
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": API_VERSION,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as CashfreeOrderPayment[]) : [];
}

/** Returns the first successful payment for a Cashfree order, if any. */
export function findSuccessfulPayment(payments: CashfreeOrderPayment[]) {
  return payments.find((payment) => payment.payment_status === "SUCCESS") ?? null;
}

/**
 * Verifies a Cashfree webhook signature.
 * Cashfree signs `x-webhook-timestamp + rawBody` with the PG secret key using
 * HMAC-SHA256 and sends it base64-encoded in the `x-webhook-signature` header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null, timestamp?: string | null) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
  if (!secret || !signature) return false;
  const payload = `${timestamp ?? ""}${rawBody}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64");
  return safeEqual(expected, signature);
}

function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
