import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startOnlineCheckout } from "@/lib/checkout-intents";
import { createOrderForUser } from "@/lib/orders";
import { cashfreeConfigured } from "@/lib/cashfree";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkoutSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to place an order." }, { status: 401 });
  if (user.is_blocked) return NextResponse.json({ error: "This account is unavailable." }, { status: 403 });

  const limit = rateLimit(`checkout:${user.id}`, 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: Object.values(first)[0]?.[0] ?? parsed.error.issues[0]?.message ?? "Please check your checkout details." },
      { status: 400 },
    );
  }

  // Online payment in the live app: validate the bag, open Cashfree and store
  // a signed checkout intent. No order exists until the payment is verified.
  if (parsed.data.payment_method === "online" && isSupabaseConfigured()) {
    if (!cashfreeConfigured()) {
      return NextResponse.json(
        { error: "Online payments are temporarily unavailable. Please choose cash on delivery." },
        { status: 400 },
      );
    }
    const started = await startOnlineCheckout(user, parsed.data);
    if (!started.ok) return NextResponse.json({ error: started.error }, { status: 400 });
    return NextResponse.json({
      ok: true,
      checkoutReference: started.checkoutReference,
      total: started.total,
      cashfree: started.cashfree,
    });
  }

  // Cash on delivery (and demo-mode online payments, which are simulated as
  // already paid) create the order immediately.
  const result = await createOrderForUser(user, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    orderId: result.order.id,
    orderNumber: result.order.order_number,
    total: result.order.total,
    cashfree: result.cashfree ?? null,
    simulatedPayment: Boolean(result.simulatedPayment),
  });
}
