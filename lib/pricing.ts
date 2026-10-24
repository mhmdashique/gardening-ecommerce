import type { CartTotals, Coupon, SiteSettings } from "@/lib/types";

export interface TotalsLine {
  price: number;
  qty: number;
  categoryId?: string;
}

export function couponDiscount(
  coupon: Coupon | null,
  lines: TotalsLine[],
): { discount: number; error: string | null } {
  if (!coupon) return { discount: 0, error: null };
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  if (!coupon.is_active) return { discount: 0, error: "This coupon is no longer active." };
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date())
    return { discount: 0, error: "This coupon is not active yet." };
  if (coupon.ends_at && new Date(coupon.ends_at) < new Date())
    return { discount: 0, error: "This coupon has expired." };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)
    return { discount: 0, error: "This coupon has reached its usage limit." };
  if (subtotal < coupon.min_order)
    return {
      discount: 0,
      error: `Add ₹${Math.ceil(coupon.min_order - subtotal)} more to use ${coupon.code}.`,
    };

  const eligible =
    coupon.applies_to === "category" && coupon.category_id
      ? lines.filter((line) => line.categoryId === coupon.category_id)
      : lines;
  const eligibleSubtotal = eligible.reduce((sum, line) => sum + line.price * line.qty, 0);
  if (eligibleSubtotal <= 0)
    return { discount: 0, error: "This coupon does not apply to the items in your bag." };

  let discount =
    coupon.type === "percent" ? Math.round((eligibleSubtotal * coupon.value) / 100) : coupon.value;
  if (coupon.max_discount !== null) discount = Math.min(discount, coupon.max_discount);
  discount = Math.min(discount, subtotal);
  return { discount: Math.max(0, discount), error: null };
}

export interface ComputeTotalsInput {
  lines: TotalsLine[];
  settings: SiteSettings;
  coupon?: Coupon | null;
  zoneCharge?: number | null;
  loyaltyPointsToRedeem?: number;
  loyaltyPointsBalance?: number;
  isFirstOrder?: boolean;
}

/**
 * Converts points to a rupee discount. Redemption is capped by the customer's
 * balance and by the amount still payable, so an order always keeps at least
 * ₹1 due (which also keeps online payments valid).
 */
export function loyaltyRedemption({
  pointsRequested,
  pointsBalance,
  redeemRate,
  maxValue,
}: {
  pointsRequested: number;
  pointsBalance: number;
  redeemRate: number;
  maxValue: number;
}) {
  if (pointsRequested <= 0 || pointsBalance <= 0 || redeemRate <= 0 || maxValue <= 0) {
    return { pointsUsed: 0, discount: 0 };
  }
  const requested = Math.min(Math.floor(pointsRequested), Math.floor(pointsBalance));
  const requestedValue = Math.floor((requested * 100) / redeemRate);
  const discount = Math.min(requestedValue, Math.floor(maxValue));
  if (discount <= 0) return { pointsUsed: 0, discount: 0 };
  const pointsUsed = Math.min(requested, Math.ceil((discount * redeemRate) / 100));
  return { pointsUsed, discount };
}

export function computeTotals({
  lines,
  settings,
  coupon = null,
  zoneCharge = null,
  loyaltyPointsToRedeem = 0,
  loyaltyPointsBalance = 0,
  isFirstOrder = false,
}: ComputeTotalsInput): CartTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  let discount = 0;
  let couponError: string | null = null;
  if (coupon && coupon.first_order_only && !isFirstOrder) {
    couponError = "This coupon is valid on your first order only.";
  } else {
    const result = couponDiscount(coupon, lines);
    discount = result.discount;
    couponError = result.error;
  }
  const afterCoupon = Math.max(0, subtotal - discount);
  const { pointsUsed: loyaltyPointsUsed, discount: loyaltyDiscount } =
    settings.loyalty_enabled && settings.loyalty_redeem_rate > 0
      ? loyaltyRedemption({
          pointsRequested: loyaltyPointsToRedeem,
          pointsBalance: loyaltyPointsBalance,
          redeemRate: settings.loyalty_redeem_rate,
          maxValue: Math.max(0, afterCoupon - 1),
        })
      : { pointsUsed: 0, discount: 0 };
  const afterDiscount = Math.max(0, afterCoupon - loyaltyDiscount);
  const charge = zoneCharge ?? settings.delivery_charge;
  const qualifiesFree = afterDiscount >= settings.free_shipping_threshold;
  const deliveryCharge = subtotal === 0 || qualifiesFree ? 0 : charge;
  const gst = Math.round((afterDiscount * settings.gst_percent) / (100 + settings.gst_percent));
  const total = afterDiscount + deliveryCharge;
  const freeShippingRemaining = Math.max(0, settings.free_shipping_threshold - afterDiscount);
  const loyaltyPointsEarned =
    settings.loyalty_enabled && settings.loyalty_earn_rate > 0
      ? Math.floor(afterDiscount / 100) * settings.loyalty_earn_rate
      : 0;

  return {
    subtotal,
    discount,
    loyaltyDiscount,
    deliveryCharge,
    gst,
    total,
    freeShippingRemaining,
    loyaltyPointsEarned,
    loyaltyPointsUsed,
    couponApplied: couponError ? null : coupon,
    couponError,
  };
}

export function formatPincode(pincode: string) {
  return pincode.replace(/\D/g, "").slice(0, 6);
}

export function isValidPincode(pincode: string) {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function paymentMethodLabel(method: string) {
  return method === "cod" ? "Cash on Delivery" : "Paid online";
}
