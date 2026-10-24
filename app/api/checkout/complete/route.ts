import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { completeOnlineCheckout } from "@/lib/checkout-intents";
import { rateLimit } from "@/lib/rate-limit";

const completeSchema = z.object({
  reference: z.string().trim().min(6).max(64),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to confirm your order." }, { status: 401 });
  if (user.is_blocked) return NextResponse.json({ error: "This account is unavailable." }, { status: 403 });

  const limit = rateLimit(`checkout-complete:${user.id}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payment reference missing." }, { status: 400 });
  }

  const result = await completeOnlineCheckout(user, parsed.data.reference);
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      orderId: result.order.id,
      orderNumber: result.order.order_number,
      total: result.order.total,
    });
  }

  const status = result.status ?? (result.pending ? 402 : 400);
  return NextResponse.json(
    {
      ok: false,
      pending: Boolean(result.pending),
      retryable: Boolean(result.retryable),
      error: result.error,
    },
    { status },
  );
}
