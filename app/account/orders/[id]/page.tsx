import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Download,
  MapPin,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrderForUser, getSettings } from "@/lib/catalog";
import { CancelOrderButton, ReturnButton, ReviewButton } from "@/components/account-forms";
import { OrderAddress, OrderProgress, OrderTotals, TrackingSummary } from "@/components/order-views";
import { PayNowButton } from "@/components/pay-now-button";
import { PaymentStatusSync } from "@/components/payment-status-sync";
import { SafeImage } from "@/components/safe-image";
import { Badge, PaymentStatusChip, StatusChip, buttonClasses } from "@/components/ui";
import { formatDateTime, formatINR, paymentStatusLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/account/orders");
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderForUser(id, user.id), getSettings()]);
  if (!order) notFound();

  const canCancel = ["processing", "packed"].includes(order.status);
  const canReview = order.status === "delivered";
  const paymentPending = order.payment_method === "online" && order.payment_status !== "paid";
  const online = order.payment_method === "online";

  return (
    <div className="space-y-5">
      {paymentPending && <PaymentStatusSync orderId={order.id} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline">
            <ArrowLeft className="h-3 w-3" /> All orders
          </Link>
          <h1 className="display-title mt-1.5 text-[24px] font-semibold text-forest-950 sm:text-[30px]">
            Order {order.order_number}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Placed {formatDateTime(order.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" />{" "}
              {online ? `Online · ${paymentStatusLabel(order.payment_status)}` : "Cash on delivery"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentStatusChip status={order.payment_status} />
        </div>
      </div>

      <section className="card p-4 sm:p-5">
        <OrderProgress status={order.status} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
          <TrackingSummary order={order} />
          <div className="flex flex-wrap gap-2">
            {paymentPending && <PayNowButton orderId={order.id} />}
            {canCancel && <CancelOrderButton orderId={order.id} />}
            {(order.status === "shipped" || order.status === "delivered") && (
              <Link href={`/account/orders/${order.id}/track`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                <Truck className="h-3.5 w-3.5" /> Track order
              </Link>
            )}
          </div>
        </div>
        {paymentPending && (
          <p className="mt-3 rounded-xl bg-amber-soft px-3 py-2 text-[11.5px] text-amber-ink">
            Payment is pending for this order. Your plants are reserved while you complete payment.
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
                <Package className="h-4 w-4 text-forest-600" /> Items
              </h2>
              <Badge tone="neutral">
                {order.items.reduce((sum, item) => sum + item.qty, 0)} item
                {order.items.reduce((sum, item) => sum + item.qty, 0) === 1 ? "" : "s"}
              </Badge>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="p-4 sm:p-5">
                  <div className="flex gap-3">
                    <Link href={`/product/${item.slug}`} className="relative h-[82px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-leaf-mint">
                      <SafeImage src={item.image} alt={item.name} sizes="68px" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/product/${item.slug}`} className="line-clamp-2 text-[13px] font-semibold text-forest-950 hover:underline">
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {item.size} · {item.pot_type} · Qty {item.qty}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">SKU {item.sku}</p>
                        </div>
                        <p className="text-[13px] font-bold text-forest-950">{formatINR(item.price * item.qty)}</p>
                      </div>
                      {canReview && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <ReviewButton item={item} orderId={order.id} />
                          <ReturnButton item={item} orderId={order.id} />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
              <Truck className="h-4 w-4 text-forest-600" /> Timeline
            </h2>
            <ol className="mt-4 space-y-4">
              {order.status_history.map((entry, index) => (
                <li key={entry.id} className="relative flex gap-3">
                  {index < order.status_history.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-forest-100" aria-hidden />
                  )}
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-forest-600 ring-4 ring-leaf-soft" />
                  <div>
                    <p className="text-[12.5px] font-semibold capitalize text-forest-950">{entry.status}</p>
                    {entry.note && <p className="mt-0.5 text-[11.5px] text-muted">{entry.note}</p>}
                    <p className="mt-0.5 text-[10px] text-muted/80">{formatDateTime(entry.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
            {order.status === "delivered" && (
              <p className="mt-4 rounded-xl bg-leaf-mint px-3 py-2 text-[11.5px] text-forest-800">
                Delivered. Not happy with a plant? Report a problem within {settings.return_window_days} days of delivery.
              </p>
            )}
          </section>

          {order.notes && (
            <section className="card p-4 sm:p-5">
              <h2 className="font-display text-[16px] font-semibold text-forest-950">Your note</h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{order.notes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
              <ReceiptText className="h-4 w-4 text-forest-600" /> Bill summary
            </h2>
            <div className="mt-3">
              <OrderTotals order={order} />
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <a
                href={`/api/orders/${order.id}/invoice`}
                className={buttonClasses({ variant: "secondary", size: "sm", className: "w-full" })}
              >
                <Download className="h-3.5 w-3.5" /> Download invoice
              </a>
              <p className="mt-2 text-[10px] text-muted">
                Invoice {order.invoice_number ?? `INV-${order.order_number}`} · GSTIN {settings.gst_number}
              </p>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
              <MapPin className="h-4 w-4 text-forest-600" /> Delivery address
            </h2>
            <div className="mt-2.5">
              <OrderAddress order={order} />
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-forest-950">Payment</h2>
            <dl className="mt-2.5 space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted">Method</dt>
                <dd className="font-medium text-forest-900">{online ? "Online (Cashfree)" : "Cash on delivery"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd className="font-medium capitalize text-forest-900">{paymentStatusLabel(order.payment_status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Amount</dt>
                <dd className="font-semibold text-forest-950">{formatINR(order.total)}</dd>
              </div>
              {settings.loyalty_enabled && order.loyalty_points_used > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Points redeemed</dt>
                  <dd className="font-medium text-forest-900">−{order.loyalty_points_used}</dd>
                </div>
              )}
              {settings.loyalty_enabled && order.loyalty_points_earned > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Leaf points</dt>
                  <dd className="font-medium text-forest-900">+{order.loyalty_points_earned}</dd>
                </div>
              )}
            </dl>
            {paymentPending && (
              <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-[10.5px] text-amber-ink">
                Complete payment to confirm your order. Nothing has been charged yet.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-forest-100 bg-leaf-mint p-4">
            <h2 className="text-[12px] font-semibold text-forest-950">Need a hand?</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Our plant doctors can help with care, delivery or a damaged leaf.
            </p>
            <Link href="/contact" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 hover:underline">
              Contact support
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
