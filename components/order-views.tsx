import Image from "next/image";
import Link from "next/link";
import { Check, Circle, MapPin, Package, Truck, XCircle } from "lucide-react";
import { PaymentStatusChip, StatusChip, buttonClasses } from "@/components/ui";
import { cn, formatDate, formatINR } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const steps: { key: OrderStatus; label: string }[] = [
  { key: "processing", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const stepIndex: Record<string, number> = {
  processing: 0,
  packed: 1,
  shipped: 2,
  delivered: 3,
};

export function OrderProgress({ status, compact = false }: { status: OrderStatus; compact?: boolean }) {
  if (status === "cancelled" || status === "returned") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-danger-soft/60 px-3 py-2 text-[11.5px] font-medium text-danger-ink">
        <XCircle className="h-4 w-4" />
        {status === "cancelled" ? "This order was cancelled." : "This order was returned."}
      </div>
    );
  }
  const current = stepIndex[status] ?? 0;
  return (
    <ol className={cn("flex items-center", compact ? "gap-0.5" : "gap-1")} aria-label={`Order status: ${status}`}>
      {steps.map((step, index) => {
        const done = index <= current;
        const active = index === current;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-1 last:flex-none">
            <span className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "grid place-items-center rounded-full border transition",
                  compact ? "h-5 w-5" : "h-7 w-7",
                  done
                    ? active
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-forest-600 bg-forest-600 text-white"
                    : "border-forest-200 bg-white text-forest-300",
                )}
              >
                {done ? <Check className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} /> : <Circle className="h-2 w-2" />}
              </span>
              {!compact && (
                <span className={cn("text-[9.5px] font-medium", done ? "text-forest-800" : "text-muted")}>{step.label}</span>
              )}
            </span>
            {index < steps.length - 1 && (
              <span className={cn("mb-0 h-0.5 flex-1 rounded", index < current ? "bg-forest-600" : "bg-forest-100", !compact && "mb-4")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTotals({ order, dense = false }: { order: Order; dense?: boolean }) {
  return (
    <dl className={cn("space-y-1.5 text-[12.5px]", dense ? "text-[11.5px]" : "")}>
      <div className="flex justify-between text-muted">
        <dt>Subtotal</dt>
        <dd className="font-medium text-forest-900">{formatINR(order.subtotal)}</dd>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between text-muted">
          <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
          <dd className="font-medium text-success-ink">− {formatINR(order.discount)}</dd>
        </div>
      )}
      {(order.loyalty_discount ?? 0) > 0 && (
        <div className="flex justify-between text-muted">
          <dt>Leaf points ({order.loyalty_points_used})</dt>
          <dd className="font-medium text-success-ink">− {formatINR(order.loyalty_discount ?? 0)}</dd>
        </div>
      )}
      <div className="flex justify-between text-muted">
        <dt>Delivery</dt>
        <dd className="font-medium text-forest-900">
          {order.delivery_charge === 0 ? "Free" : formatINR(order.delivery_charge)}
        </dd>
      </div>
      <div className="flex justify-between border-t border-line pt-1.5 text-[13.5px] font-bold text-forest-950">
        <dt>Total</dt>
        <dd>{formatINR(order.total)}</dd>
      </div>
      <p className="text-[10px] text-muted">Includes {formatINR(order.gst, true)} GST</p>
    </dl>
  );
}

export function OrderAddress({ order }: { order: Order }) {
  return (
    <div className="text-[12px] leading-relaxed text-muted">
      <p className="flex items-center gap-1.5 font-semibold text-forest-900">
        <MapPin className="h-3.5 w-3.5 text-forest-600" /> {order.address.name}
      </p>
      <p className="mt-1">
        {order.address.line1}
        {order.address.line2 ? `, ${order.address.line2}` : ""}
        <br />
        {order.address.city}, {order.address.state} — {order.address.pincode}
        <br />
        Phone {order.address.phone}
      </p>
    </div>
  );
}

export function TrackingSummary({ order }: { order: Order }) {
  if (!order.tracking_number) return null;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
      <Truck className="h-3.5 w-3.5 text-forest-600" />
      {order.courier ?? "Courier"} · Tracking
      <span className="font-semibold text-forest-900">{order.tracking_number}</span>
    </p>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-leaf-mint/40 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Order {order.order_number}</p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Placed {formatDate(order.created_at)} · {itemCount} item{itemCount === 1 ? "" : "s"} · {formatINR(order.total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentStatusChip status={order.payment_status} />
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <ul className="space-y-2.5">
          {order.items.slice(0, 3).map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                <Image
                  src={item.image || "/images/plant-placeholder.svg"}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized={item.image.startsWith("/")}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-forest-950">{item.name}</span>
                <span className="block text-[10.5px] text-muted">
                  {item.size} · {item.pot_type} · Qty {item.qty}
                </span>
              </span>
              <span className="text-[12px] font-semibold text-forest-900">{formatINR(item.price * item.qty)}</span>
            </li>
          ))}
          {order.items.length > 3 && (
            <li className="text-[11px] text-muted">+ {order.items.length - 3} more item(s)</li>
          )}
        </ul>

        <div className="mt-4 border-t border-line pt-3.5">
          <OrderProgress status={order.status} compact />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <TrackingSummary order={order} />
            <div className="flex flex-wrap gap-2">
              <Link href={`/account/orders/${order.id}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                <Package className="h-3.5 w-3.5" /> View order
              </Link>
              {(order.status === "shipped" || order.status === "delivered") && (
                <Link href={`/account/orders/${order.id}/track`} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                  <Truck className="h-3.5 w-3.5" /> Track
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
