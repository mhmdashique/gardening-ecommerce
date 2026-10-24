import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, MapPin, Printer, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOrderForUser, getSettings } from "@/lib/catalog";
import { OrderStatusForm } from "@/components/admin-forms";
import { PaymentStatusSync } from "@/components/payment-status-sync";
import { SafeImage } from "@/components/safe-image";
import { Badge, PaymentStatusChip, StatusChip, buttonClasses } from "@/components/ui";
import { formatDateTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Order detail", robots: { index: false, follow: false } };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/orders");
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderForUser(id), getSettings()]);
  if (!order) notFound();
  const paymentPending = order.payment_method === "online" && order.payment_status !== "paid";

  return (
    <div className="space-y-4">
      {paymentPending && <PaymentStatusSync orderId={order.id} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Orders
          </Link>
          <h1 className="mt-1 font-display text-[22px] font-semibold text-forest-950 sm:text-[26px]">{order.order_number}</h1>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Placed {formatDateTime(order.created_at)} · {order.items.reduce((sum, item) => sum + item.qty, 0)} item(s) ·{" "}
            {order.payment_method === "cod" ? "Cash on delivery" : "Online"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentStatusChip status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-display text-[17px] font-semibold text-forest-950">Items</h2>
              <Badge tone="neutral">{order.items.length} line(s)</Badge>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4">
                  <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                    <SafeImage src={item.image} alt={item.name} sizes="48px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-forest-950">{item.name}</p>
                    <p className="text-[10.5px] text-muted">
                      {item.size} · {item.pot_type} · SKU {item.sku}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-muted">{formatINR(item.price)} × {item.qty}</p>
                  </div>
                  <p className="text-[12.5px] font-semibold text-forest-950">{formatINR(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-leaf-mint/30 p-4">
              <dl className="ml-auto max-w-xs space-y-1.5 text-[11.5px]">
                <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-success-ink"><dt>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</dt><dd>− {formatINR(order.discount)}</dd></div>
                )}
                {(order.loyalty_discount ?? 0) > 0 && (
                  <div className="flex justify-between text-success-ink"><dt>Leaf points ({order.loyalty_points_used})</dt><dd>− {formatINR(order.loyalty_discount ?? 0)}</dd></div>
                )}
                <div className="flex justify-between text-muted"><dt>Delivery</dt><dd>{order.delivery_charge === 0 ? "Free" : formatINR(order.delivery_charge)}</dd></div>
                <div className="flex justify-between border-t border-line pt-1.5 text-[13px] font-bold text-forest-950"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
                <p className="text-[9.5px] text-muted">Includes {formatINR(order.gst, true)} GST</p>
              </dl>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="card p-4">
              <h2 className="flex items-center gap-2 font-display text-[16px] font-semibold text-forest-950">
                <MapPin className="h-3.5 w-3.5 text-forest-600" /> Delivery
              </h2>
              <p className="mt-2 text-[12px] font-semibold text-forest-900">{order.address.name}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}
                <br />
                {order.address.city}, {order.address.state} — {order.address.pincode}
                <br />
                Phone {order.address.phone}
              </p>
            </section>

            <section className="card p-4">
              <h2 className="font-display text-[16px] font-semibold text-forest-950">Customer</h2>
              <p className="mt-2 text-[12px] font-semibold text-forest-900">{order.customer_name}</p>
              <p className="text-[11px] text-muted">{order.customer_email}</p>
              <Link href={`/admin/customers?q=${encodeURIComponent(order.customer_email)}`} className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest-700 hover:underline">
                View customer <ExternalLink className="h-3 w-3" />
              </Link>
              {order.notes && (
                <p className="mt-3 rounded-lg bg-leaf-mint px-2.5 py-2 text-[10.5px] leading-relaxed text-forest-800">
                  <strong>Note:</strong> {order.notes}
                </p>
              )}
            </section>
          </div>

          <section className="card p-4">
            <h2 className="flex items-center gap-2 font-display text-[16px] font-semibold text-forest-950">
              <Truck className="h-3.5 w-3.5 text-forest-600" /> Timeline
            </h2>
            <ol className="mt-3 space-y-3">
              {order.status_history.map((entry) => (
                <li key={entry.id} className="flex gap-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest-600" />
                  <div>
                    <p className="text-[11.5px] font-semibold capitalize text-forest-950">{entry.status}</p>
                    {entry.note && <p className="text-[10.5px] text-muted">{entry.note}</p>}
                    <p className="text-[9.5px] text-muted/80">
                      {formatDateTime(entry.created_at)} · {entry.changed_by ?? "system"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {order.status === "returned" && (
            <section className="card p-4">
              <h2 className="font-display text-[16px] font-semibold text-forest-950">Returns on this order</h2>
              <p className="mt-1 text-[11.5px] text-muted">
                Open the returns queue to approve, replace or refund individual items.
              </p>
              <Link href="/admin/returns" className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-2" })}>
                View returns
              </Link>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="font-display text-[17px] font-semibold text-forest-950">Update order</h2>
            <div className="mt-3">
              <OrderStatusForm order={order} />
            </div>
          </section>

          <section className="card p-4">
            <h2 className="font-display text-[17px] font-semibold text-forest-950">Payment</h2>
            <dl className="mt-2.5 space-y-1.5 text-[11.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Method</dt>
                <dd className="font-medium text-forest-900">
                  {order.payment_method === "cod" ? "Cash on delivery" : "Online (Cashfree)"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Status</dt>
                <dd><PaymentStatusChip status={order.payment_status} dot={false} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Amount</dt>
                <dd className="font-semibold text-forest-950">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-4">
            <h2 className="font-display text-[17px] font-semibold text-forest-950">Documents</h2>
            <div className="mt-3 grid gap-2">
              <a href={`/api/orders/${order.id}/invoice`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                <Download className="h-3.5 w-3.5" /> Invoice PDF
              </a>
              <a href={`/api/admin/orders/${order.id}/label`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                <Printer className="h-3.5 w-3.5" /> Shipping label
              </a>
            </div>
            <p className="mt-2 text-[10px] text-muted">GSTIN {settings.gst_number} · {settings.store_name}</p>
          </section>

          <section className="rounded-2xl border border-forest-100 bg-leaf-mint p-4">
            <h2 className="text-[12px] font-semibold text-forest-950">Before you dispatch</h2>
            <ul className="mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-muted">
              <li>• Check plants for pests and damaged leaves.</li>
              <li>• Confirm the pincode and phone number.</li>
              <li>• Add tracking details so the customer is notified.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
