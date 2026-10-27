import { NextResponse } from "next/server";
import { POST as handleCashfreeWebhook } from "@/app/api/webhooks/cashfree/route";

/**
 * Cashfree webhook alias.
 *
 * The full signature-verification and order-finalization handler lives at
 * `app/api/webhooks/cashfree/route.ts`. This route exposes the same handler at
 * the path configured in the Cashfree dashboard.
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  return handleCashfreeWebhook(request);
}
