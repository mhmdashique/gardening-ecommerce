import type { Metadata } from "next";
import { CheckCircle2, Flame, Percent, Sparkles, Tag, Ticket } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategories, getCoupons } from "@/lib/catalog";
import { CouponManager } from "@/components/admin-forms";
import { formatINR } from "@/lib/utils";
import type { Coupon } from "@/lib/types";

export const metadata: Metadata = { title: "Discounts & Coupons | Admin", robots: { index: false, follow: false } };

export default async function AdminCouponsPage() {
  await requireAdmin("/admin/coupons");
  const [coupons, categories] = await Promise.all([getCoupons(), getCategories(true)]);
  const active = coupons.filter((coupon) => coupon.is_active);
  const redemptions = coupons.reduce((sum, coupon) => sum + coupon.used_count, 0);
  const firstOrder = coupons.filter((coupon) => coupon.first_order_only).length;
  const bestOffer = active.reduce<Coupon | null>(
    (best, coupon) => (!best || coupon.value > best.value ? coupon : best),
    null,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Discount Coupons</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {coupons.length} Active Offers
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Configure promotional codes, percentage discounts, first-order bonuses, and minimum basket requirements.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Coupons</span>
            <Ticket className="h-4 w-4 text-forest-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">{coupons.length}</p>
          <p className="mt-1 text-[11px] text-muted">All promotion codes created</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live &amp; Redeemable</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-950">{active.length}</p>
          <p className="mt-1 text-[11px] text-emerald-700">Currently active at checkout</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Redemptions</span>
            <Flame className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-purple-950">{redemptions}</p>
          <p className="mt-1 text-[11px] text-purple-700">Total customer checkout uses</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Offer Value</span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-950">
            {bestOffer ? (bestOffer.type === "percent" ? `${bestOffer.value}% OFF` : formatINR(bestOffer.value)) : "—"}
          </p>
          <p className="mt-1 text-[11px] text-amber-700">{firstOrder} exclusive first-order deals</p>
        </div>
      </div>

      {/* Coupon Manager Card */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <CouponManager coupons={coupons} categories={categories} />
      </section>
    </div>
  );
}

