import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Gift, Sparkles, Sprout } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCustomerLoyalty, getSettings } from "@/lib/catalog";
import { Badge, EmptyState, buttonClasses } from "@/components/ui";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaf points", robots: { index: false, follow: false } };

export default async function AccountLoyaltyPage() {
  const user = await requireUser("/account/loyalty");
  const settings = await getSettings();
  if (!settings.loyalty_enabled) redirect("/account");

  const transactions = await getCustomerLoyalty(user.id);
  const points = user.loyalty_points;
  const value = settings.loyalty_redeem_rate > 0 ? Math.floor((points / settings.loyalty_redeem_rate) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">Grow a little more</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Leaf points</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Earn points on every order and turn them into savings.</p>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-forest-900 p-5 text-white shadow-card sm:p-6">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-200">
              <Sparkles className="h-3.5 w-3.5" /> Your balance
            </p>
            <p className="mt-2 font-display text-[42px] font-semibold leading-none">{points}</p>
            <p className="mt-1 text-[12px] text-white/60">points · worth {formatINR(value)}</p>
          </div>
          <Link href="/shop" className={buttonClasses({ variant: "amber", size: "sm" })}>
            Earn more points <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-soft text-forest-700">
            <Sprout className="h-4 w-4" />
          </span>
          <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Earn rate</p>
          <p className="mt-1 text-[13px] font-semibold text-forest-950">
            {settings.loyalty_earn_rate} point{settings.loyalty_earn_rate === 1 ? "" : "s"} per ₹100
          </p>
        </div>
        <div className="card p-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber-ink">
            <Gift className="h-4 w-4" />
          </span>
          <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Redeem rate</p>
          <p className="mt-1 text-[13px] font-semibold text-forest-950">
            {settings.loyalty_redeem_rate} points = ₹100
          </p>
        </div>
        <div className="card p-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-soft text-sky-ink">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Points value</p>
          <p className="mt-1 text-[13px] font-semibold text-forest-950">{formatINR(value)} available</p>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Points activity</h2>
          <Badge tone="green">{transactions.length} entries</Badge>
        </div>
        {transactions.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Sparkles}
              title="No points activity yet"
              description={`Place an order to start earning ${settings.loyalty_earn_rate} point(s) per ₹100 spent.`}
              action={
                <Link href="/shop" className={buttonClasses()}>
                  Start shopping
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-[12.5px] font-semibold text-forest-950">
                    {transaction.note ?? transaction.type}
                  </p>
                  <p className="text-[10.5px] capitalize text-muted">
                    {transaction.type} · {formatDate(transaction.created_at)}
                  </p>
                </div>
                <span
                  className={
                    transaction.points >= 0
                      ? "text-[13px] font-bold text-success-ink"
                      : "text-[13px] font-bold text-danger"
                  }
                >
                  {transaction.points >= 0 ? "+" : ""}
                  {transaction.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="rounded-xl bg-leaf-mint px-4 py-3 text-[11px] leading-relaxed text-forest-800">
        Points are awarded after a successful online payment or when a cash-on-delivery order is marked delivered.
        Choose to use them at checkout; at least ₹1 stays payable. Cancelled orders return any redeemed points. They
        cannot be exchanged for cash and expire only if the account is closed.
      </p>
    </div>
  );
}
