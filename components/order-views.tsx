import Link from "next/link";
import { Check, ChevronRight, Circle, MapPin, Truck, XCircle } from "lucide-react";
import { PaymentStatusChip, StatusChip } from "@/components/ui";
import { premiumSurface } from "@/components/premium";
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

const tableHeaders: { label: string; className: string }[] = [
  { label: "Order no.", className: "" },
  { label: "Name", className: "" },
  { label: "Date & time", className: "" },
  { label: "Delivery status", className: "" },
  { label: "Payment status", className: "" },
  { label: "Total", className: "text-right" },
];

export function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <section className={cn(premiumSurface, "overflow-hidden")} aria-label="Order history">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">Your orders with delivery and payment status</caption>
          <thead>
            <tr className="border-b border-line/70 bg-forest-50/50">
              {tableHeaders.map((header) => (
                <th
                  key={header.label}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted sm:px-5",
                    header.className,
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const first = order.items[0];
              const extraItems = order.items.length - 1;
              return (
                <tr
                  key={order.id}
                  className="relative border-b border-line/60 transition last:border-0 hover:bg-leaf-mint/25"
                >
                  <td className="px-4 py-4 align-middle sm:px-5">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="group block after:absolute after:inset-0 after:z-0"
                      aria-label={`View order ${order.order_number}`}
                    >
                      <span className="block font-mono text-[12.5px] font-semibold tracking-tight text-forest-950">
                        {order.order_number}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] tabular-nums text-muted">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)} item
                        {order.items.reduce((sum, item) => sum + item.qty, 0) === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </td>
                  <td className="max-w-[230px] px-4 py-4 align-middle sm:px-5">
                    <span className="block truncate text-[12.5px] font-semibold tracking-tight text-forest-950">
                      {first?.name ?? "Order"}
                    </span>
                    {extraItems > 0 && (
                      <span className="mt-0.5 block text-[10.5px] text-muted">+{extraItems} more item{extraItems === 1 ? "" : "s"}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-middle sm:px-5">
                    <span className="block text-[12.5px] font-semibold text-forest-950">{formatDate(order.created_at)}</span>
                    <span className="mt-0.5 block text-[10.5px] tabular-nums text-muted">
                      {formatDate(order.created_at, { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle sm:px-5">
                    <StatusChip status={order.status} />
                  </td>
                  <td className="px-4 py-4 align-middle sm:px-5">
                    <PaymentStatusChip status={order.payment_status} />
                  </td>
                  <td className="px-4 py-4 text-right align-middle sm:px-5">
                    <span className="block text-[13px] font-bold tabular-nums tracking-tight text-forest-950">
                      {formatINR(order.total)}
                    </span>
                    <span className="relative z-10 mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-forest-700 transition group-hover:text-forest-950">
                      View order <ChevronRight className="h-3 w-3 text-forest-300" aria-hidden />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
