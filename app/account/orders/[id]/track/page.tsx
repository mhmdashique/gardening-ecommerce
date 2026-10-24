import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrderForUser, getSettings } from "@/lib/catalog";
import { OrderAddress, OrderProgress } from "@/components/order-views";
import { StatusChip } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Track order", robots: { index: false, follow: false } };

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/account/orders");
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderForUser(id, user.id), getSettings()]);
  if (!order) notFound();

  const eta = new Date(new Date(order.created_at).getTime() + 5 * 86400_000);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/account/orders/${order.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Order details
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <h1 className="display-title text-[24px] font-semibold text-forest-950 sm:text-[30px]">Track {order.order_number}</h1>
          <StatusChip status={order.status} />
        </div>
        <p className="mt-1 text-[11.5px] text-muted">Estimated delivery {formatDate(eta)}</p>
      </div>

      <section className="card p-5 sm:p-6">
        <OrderProgress status={order.status} />
        <div className="mt-5 grid gap-3 rounded-xl bg-leaf-mint/60 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Courier</p>
            <p className="mt-1 text-[13px] font-semibold text-forest-950">{order.courier ?? "Awaiting dispatch"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Tracking number</p>
            <p className="mt-1 text-[13px] font-semibold text-forest-950">{order.tracking_number ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Items</p>
            <p className="mt-1 text-[13px] font-semibold text-forest-950">
              {order.items.reduce((sum, item) => sum + item.qty, 0)} plants & accessories
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card p-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Delivery journey</h2>
          <ol className="mt-4 space-y-5">
            {order.status_history.map((entry, index) => (
              <li key={entry.id} className="relative flex gap-3">
                {index < order.status_history.length - 1 && (
                  <span className="absolute left-[11px] top-7 h-full w-px bg-forest-100" aria-hidden />
                )}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf-soft text-forest-700">
                  {entry.status === "delivered" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold capitalize text-forest-950">{entry.status}</p>
                  {entry.note && <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{entry.note}</p>}
                  <p className="mt-0.5 text-[10px] text-muted/80">{formatDateTime(entry.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2.5 text-[11.5px] text-forest-800">
              <Truck className="h-4 w-4 text-forest-600" />
              We&apos;ll update this page and email you as soon as the status changes.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold text-forest-950">
              <MapPin className="h-4 w-4 text-forest-600" /> Delivering to
            </h2>
            <div className="mt-2">
              <OrderAddress order={order} />
            </div>
          </section>
          <section className="rounded-2xl border border-forest-100 bg-leaf-mint p-4">
            <h2 className="text-[12px] font-semibold text-forest-950">Delivery not moving?</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              If tracking has not changed for 48 hours, contact us with order {order.order_number}. We&apos;ll chase it
              with the courier.
            </p>
            <Link href="/contact" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 hover:underline">
              Talk to support
            </Link>
          </section>
          <p className="px-1 text-[10px] leading-relaxed text-muted">
            Return window: {settings.return_window_days} days from delivery. Plants are living things — tell us within{" "}
            {settings.claim_window_hours} hours if something arrives damaged.
          </p>
        </aside>
      </div>
    </div>
  );
}
