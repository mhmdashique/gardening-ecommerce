import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getCouponByCode,
  getCustomerOrderCount,
  getSettings,
  getVariantForCheckout,
} from "@/lib/catalog";
import { computeTotals } from "@/lib/pricing";
import { couponValidateSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const limit = rateLimit(user ? `coupon:${user.id}` : clientKey(request.headers, "coupon"), 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many coupon attempts. Please wait a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = couponValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid coupon code." }, { status: 400 });
  }

  const coupon = await getCouponByCode(parsed.data.code);
  if (!coupon) {
    return NextResponse.json({ error: "That coupon code doesn't exist. Check the spelling and try again." }, { status: 404 });
  }

  const lines = [];
  for (const item of parsed.data.items) {
    const variant = await getVariantForCheckout(item.variantId);
    if (!variant) return NextResponse.json({ error: "One of the items in your bag is no longer available." }, { status: 400 });
    lines.push({ price: variant.price, qty: item.qty, categoryId: variant.categoryId });
  }

  const settings = await getSettings();
  const orderCount = user ? await getCustomerOrderCount(user.id) : 0;
  const totals = computeTotals({
    lines,
    settings,
    coupon,
    isFirstOrder: orderCount === 0,
  });

  if (coupon.first_order_only && user && orderCount > 0) {
    return NextResponse.json({ error: "This coupon is valid on your first order only." }, { status: 400 });
  }
  if (totals.couponError) {
    return NextResponse.json({ error: totals.couponError }, { status: 400 });
  }

  return NextResponse.json({ coupon, discount: totals.discount });
}
