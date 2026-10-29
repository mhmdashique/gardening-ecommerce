import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight, Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/catalog";
import { OrderTable } from "@/components/order-views";
import { EmptyState, PaymentStatusChip, StatusChip, buttonClasses } from "@/components/ui";
import { cn, formatDate, formatINR } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "My Orders", robots: { index: false, follow: false } };

const tabs = [
  { key: "all", label: "All orders" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex flex-col">
      <span className="text-[19px] font-semibold leading-none tabular-nums tracking-tight text-forest-950">
        {value}
      </span>
      <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
    </span>
  );
}

function MobileOrderCard({ order }: { order: Order }) {
  const first = order.items[0];
  const extraItems = order.items.length - 1;
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block overflow-hidden transition active:bg-leaf-mint/40 sm:hidden"
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">Order</p>
          <p className="mt-0.5 truncate font-mono text-[12.5px] font-semibold tracking-tight text-forest-950">
            {order.order_number}
          </p>
        </div>
        <StatusChip status={order.status} />
      </div>

      <div className="mt-3 flex items-center gap-3 px-4">
        <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-2xl bg-leaf-mint ring-1 ring-line/60">
          <Image
            src={first?.image || "/images/plant-placeholder.svg"}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold tracking-tight text-forest-950">
            {first?.name ?? "Order"}
          </span>
          <span className="mt-0.5 block text-[10.5px] text-muted">
            {first ? <>Qty {first.qty}</> : null}
            {extraItems > 0 ? <>{first ? " · " : ""}+{extraItems} more</> : null}
          </span>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
            <CalendarDays className="h-3 w-3" aria-hidden /> {formatDate(order.created_at)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">Total</span>
          <span className="mt-0.5 block text-[14px] font-semibold tabular-nums tracking-tight text-forest-950">
            {formatINR(order.total)}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 px-4 py-2.5">
        <PaymentStatusChip status={order.payment_status} dot={false} />
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700">
          View details <ChevronRight className="h-3.5 w-3.5 text-forest-300" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/account/orders");
  const params = await searchParams;
  const requested = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = tabs.some((tab) => tab.key === requested) ? (requested as string) : "all";
  const orders = await getOrdersForUser(user.id);
  const filtered = status === "all" ? orders : orders.filter((order) => order.status === status);
  const inProgress = orders.filter((order) => !["delivered", "cancelled", "returned"].includes(order.status)).length;
  const delivered = orders.filter((order) => order.status === "delivered").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="display-title text-[24px] font-semibold text-forest-950 sm:text-[30px]">My Orders</h1>
        <p className="mt-1 text-[12.5px] text-muted">
          Track deliveries, download invoices and get help with any plant.
        </p>
      </div>

      {/* Stats */}
      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Overview</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5 px-4 sm:px-5 py-4">
          <div className="card p-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-soft text-forest-700">
              <Package className="h-4 w-4" />
            </div>
            <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Total orders</p>
            <p className="mt-1 text-[13px] font-semibold text-forest-950">{formatNumber(orders.length)}</p>
          </div>
          <div className="card p-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-soft text-forest-700">
              <Package className="h-4 w-4" />
            </div>
            <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">In progress</p>
            <p className="mt-1 text-[13px] font-semibold text-forest-950">{formatNumber(inProgress)}</p>
          </div>
          <div className="card p-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-forest-soft text-forest-700">
              <Package className="h-4 w-4" />
            </div>
            <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Delivered</p>
            <p className="mt-1 text-[13px] font-semibold text-forest-950">{formatNumber(delivered)}</p>
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Filter orders</h2>
        </div>
        <div className="overflow-x-auto px-4 sm:px-5 pb-4">
          <div
            role="tablist"
            aria-label="Filter orders"
            className="flex items-center gap-1 sm:min-w-0"
          >
            {tabs.map((tab) => {
              const count = tab.key === "all" ? orders.length : orders.filter((order) => order.status === tab.key).length;
              const active = status === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.key === "all" ? "/account/orders" : `/account/orders?status=${tab.key}`}
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-semibold transition",
                    active
                      ? "bg-forest-950 text-white shadow-[0_10px_20px_-14px_rgba(13,43,30,0.9)]"
                      : "text-forest-700 hover:bg-[#f7faf7]",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[9.5px] tabular-nums",
                      active ? "bg-white/15 text-white/80" : "bg-forest-50 text-muted",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <section className="card p-4 sm:p-5">
          <EmptyState
            icon={Package}
            title={status === "all" ? "No orders yet" : `No ${status} orders`}
            titleClassName="text-xl font-semibold tracking-tight text-forest-950"
            description={
              status === "all"
                ? "Your first plant delivery is waiting to happen. Pick something that fits your light."
                : "Nothing in this stage right now. Try another filter or keep shopping."
            }
            action={
              <Link href="/shop" className={buttonClasses()}>
                Browse plants
              </Link>
            }
          />
        </section>
      ) : (
        <>
          <div className="space-y-3.5 sm:hidden">
            {filtered.map((order) => (
              <MobileOrderCard key={order.id} order={order} />
            ))}
          </div>
          <div className="hidden sm:block">
            <OrderTable orders={filtered} />
          </div>
        </>
      )}
    </div>
  );
}
