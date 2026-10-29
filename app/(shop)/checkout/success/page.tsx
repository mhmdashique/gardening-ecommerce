import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, Eye, Package, Sprout, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrderForUser, getSettings, getSiteFeedbackForOrder } from "@/lib/catalog";
import { buttonClasses, Badge } from "@/components/ui";
import { OrderAddress, OrderProgress, OrderTotals, TrackingSummary } from "@/components/order-views";
import { SafeImage } from "@/components/safe-image";
import { OrderFeedback } from "@/components/feedback-form";
import { submitWebsiteFeedbackAction } from "@/lib/actions/account";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/account/orders");
  const params = await searchParams;
  const reference = Array.isArray(params.order) ? params.order[0] : params.order;
  if (!reference) notFound();

  const [order, settings] = await Promise.all([getOrderForUser(reference, user.id), getSettings()]);
  if (!order) notFound();
  const pastFeedback = await getSiteFeedbackForOrder(user.id, order.id);

  const paid = order.payment_status === "paid";
  const cod = order.payment_method === "cod";
  const pending = !paid;
  const eta = new Date(new Date(order.created_at).getTime() + 5 * 86400_000);

  return (
    <div className="container-shell py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Confirmation banner */}
        <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-9">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success-ink">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="eyebrow mt-5">{pending && !cod ? "Order saved" : "Order confirmed"}</p>
          <h1 className="display-title mt-1.5 text-[28px] font-semibold text-forest-950 sm:text-[34px]">
            {pending && !cod ? "One last step" : "Your plants are on their way to you"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            {cod
              ? `Order ${order.order_number} is confirmed. Please keep ${formatINR(order.total)} ready to pay on delivery.`
              : paid
                ? `Order ${order.order_number} is confirmed. We'll email updates as it is packed and shipped.`
                : "We've reserved your order, but the online payment has not been completed yet. Open the order to retry securely."}
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl bg-leaf-mint/60 p-4 text-left sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Order number</p>
              <p className="mt-1 text-[13px] font-semibold text-forest-950">{order.order_number}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Total</p>
              <p className="mt-1 text-[13px] font-semibold text-forest-950">{formatINR(order.total)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Estimated delivery</p>
              <p className="mt-1 text-[13px] font-semibold text-forest-950">{formatDate(eta)}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/account/orders/${order.id}`} className={buttonClasses()}>
              <Package className="h-4 w-4" /> View details
            </Link>
            <a href={`/api/orders/${order.id}/invoice`} className={buttonClasses({ variant: "secondary" })}>
              <Download className="h-4 w-4" /> Download invoice
            </a>
            <Link href="/shop" className={buttonClasses({ variant: "secondary" })}>
              Browse plants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-forest-600" /> Packed with care
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-forest-600" /> Tracked delivery
            </span>
            <span className="flex items-center gap-1.5">
              <Sprout className="h-3.5 w-3.5 text-forest-600" /> {settings.return_window_days}-day plant cover
            </span>
          </div>
        </div>

        {/* Order details */}
        <section className="card mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-forest-950">Order details</h2>
            <Badge tone={pending ? "amber" : "green"}>{pending ? "Unpaid" : "Paid"}</Badge>
          </div>

          <div className="mt-4">
            <OrderProgress status={order.status} />
          </div>
          <div className="mt-3">
            <TrackingSummary order={order} />
          </div>

          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                  <SafeImage src={item.image} alt={item.name} sizes="48px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-forest-950">{item.name}</p>
                  <p className="text-[10.5px] text-muted">
                    {item.size} · {item.pot_type} · Qty {item.qty}
                  </p>
                </div>
                <p className="text-[12.5px] font-semibold text-forest-900">{formatINR(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Delivering to</p>
              <div className="mt-1.5">
                <OrderAddress order={order} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Bill summary</p>
              <div className="mt-1.5">
                <OrderTotals order={order} dense />
              </div>
              <p className="mt-2 text-[10.5px] text-muted">
                {cod ? "Pay on delivery" : pending ? "Total due" : "Total paid"} shown with the invoice.{" "}
                <Link href="/contact" className="font-semibold text-forest-700 underline underline-offset-2">
                  Questions?
                </Link>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`/api/orders/${order.id}/invoice?preview=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest-700 underline underline-offset-2"
                >
                  <Eye className="h-3 w-3" /> Preview invoice
                </a>
                <a
                  href={`/api/orders/${order.id}/invoice`}
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest-700 underline underline-offset-2"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Post-order website feedback — opens as a modal after confirmation */}
        <OrderFeedback
          firstName={user.full_name.split(" ")[0] ?? "friend"}
          orderId={order.id}
          submitAction={submitWebsiteFeedbackAction}
          alreadySubmitted={pastFeedback !== null}
        />

        <p className="mt-4 text-center text-[11px] text-muted">
          Invoice {order.invoice_number ?? `INV-${order.order_number}`} · You can also find this order anytime in{" "}
          <Link href="/account/orders" className="font-semibold text-forest-700 underline underline-offset-2">
            My Orders
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
