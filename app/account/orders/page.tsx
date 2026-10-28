import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/catalog";
import { OrderCard } from "@/components/order-views";
import { EmptyState, StatusChip, buttonClasses } from "@/components/ui";
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

/** Phone-only compact order card (mobile reference design). Desktop keeps OrderCard. */
function MobileOrderCard({ order }: { order: Order }) {
  const first = order.items[0];
  const extraItems = order.items.length - 1;
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block rounded-2xl border border-line bg-white p-3.5 shadow-card transition active:bg-leaf-mint/50 sm:hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-bold tracking-tight text-forest-950">{order.order_number}</span>
        <StatusChip status={order.status} />
      </div>
      <p className="mt-1 text-[10.5px] text-muted">{formatDate(order.created_at)}</p>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
          <Image
            src={first?.image || "/images/plant-placeholder.svg"}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-forest-950">{first?.name ?? "Order"}</span>
          <span className="mt-0.5 block text-[10.5px] text-muted">
            {first ? <>{formatINR(first.price)} · Qty. {first.qty}</> : null}
            {extraItems > 0 ? <>&nbsp;+ {extraItems} more</> : null}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-bold tracking-tight text-forest-950">{formatINR(order.total)}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
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

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">Every leaf, accounted for</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">My Orders</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">
          Track deliveries, download invoices and get help with any plant.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter orders">
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
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11.5px] font-semibold transition",
                active
                  ? "border-forest-700 bg-forest-800 text-white"
                  : "border-line bg-white text-forest-800 hover:border-forest-300 hover:bg-leaf-mint",
              )}
            >
              {tab.label}
              <span className={cn("rounded-full px-1.5 text-[9.5px]", active ? "bg-white/20" : "bg-forest-50 text-muted")}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={status === "all" ? "No orders yet" : `No ${status} orders`}
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
      ) : (
        <div className="space-y-3.5">
          {filtered.map((order) => (
            <div key={order.id}>
              <MobileOrderCard order={order} />
              <div className="hidden sm:block">
                <OrderCard order={order} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
