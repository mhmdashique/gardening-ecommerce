import type { Metadata } from "next";
import Link from "next/link";
import { Download, Filter, Package, Search, ShoppingBag, Truck, User } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAllOrders } from "@/lib/catalog";
import { StatusChip, buttonClasses } from "@/components/ui";
import { cn, formatDate, formatINR, paymentStatusLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Management & Fulfillment | Admin", robots: { index: false, follow: false } };

const filters = [
  { id: "all", label: "All Orders" },
  { id: "processing", label: "Processing" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "returned", label: "Returned" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/orders");
  const params = await searchParams;
  const status = (Array.isArray(params.status) ? params.status[0] : params.status) ?? "all";
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.toLowerCase().trim() ?? "";
  const payment = (Array.isArray(params.payment) ? params.payment[0] : params.payment) ?? "all";

  const orders = await getAllOrders();
  
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const packedCount = orders.filter((o) => o.status === "packed").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const filtered = orders.filter((order) => {
    if (status !== "all" && order.status !== status) return false;
    if (payment === "cod" && order.payment_method !== "cod") return false;
    if (payment === "online" && order.payment_method !== "online") return false;
    if (payment === "pending" && order.payment_status === "paid") return false;
    if (q && !`${order.order_number} ${order.customer_name} ${order.customer_email}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Customer Orders</h1>
            <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-bold text-forest-900">
              {orders.length} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Track customer orders, manage packing slips, process greenhouse dispatches, and handle fulfillment.
          </p>
        </div>

        <a
          href="/api/admin/orders/export"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-forest-900 shadow-sm transition hover:bg-forest-50 sm:self-auto"
        >
          <Download className="h-4 w-4 text-forest-600" /> Export CSV
        </a>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Processing</p>
          <p className="mt-1 font-display text-xl font-bold text-forest-950">{processingCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Packed</p>
          <p className="mt-1 font-display text-xl font-bold text-blue-900">{packedCount}</p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">In Transit (Shipped)</p>
          <p className="mt-1 font-display text-xl font-bold text-purple-900">{shippedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Delivered</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-900">{deliveredCount}</p>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              status === f.id
                ? "border-emerald-700 bg-gradient-to-r from-emerald-800 to-forest-900 text-white shadow-sm"
                : "border-line bg-white text-forest-800 hover:border-emerald-300 hover:bg-emerald-50/50",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm" method="get">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search orders</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Order #, customer name, or email..."
            className="input-base h-11 pl-10 text-xs"
          />
        </label>
        
        <select name="payment" defaultValue={payment} className="input-base h-11 w-auto min-w-[160px] text-xs">
          <option value="all">All Payment Methods</option>
          <option value="online">Online Payment</option>
          <option value="cod">Cash on Delivery (COD)</option>
          <option value="pending">Awaiting Payment</option>
        </select>

        <button
          type="submit"
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          <Filter className="h-3.5 w-3.5" /> Filter
        </button>

        {(q || payment !== "all") && (
          <Link
            href={status === "all" ? "/admin/orders" : `/admin/orders?status=${status}`}
            className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-forest-700 hover:bg-leaf-mint"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-subtle/40 text-[10px] uppercase tracking-wider text-muted font-bold">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Date Placed</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Fulfillment</th>
                <th className="px-5 py-3.5 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((order) => (
                <tr key={order.id} className="transition hover:bg-emerald-50/20">
                  <td className="px-5 py-3.5 font-bold text-forest-950">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      {order.order_number}
                    </Link>
                    {order.coupon_code && (
                      <span className="block text-[9.5px] font-medium text-emerald-700">Coupon: {order.coupon_code}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                        {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : "U"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-forest-950">{order.customer_name}</p>
                        <p className="text-[10px] text-muted truncate max-w-xs">{order.customer_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(order.created_at)}</td>
                  <td className="px-5 py-3.5 font-medium text-forest-900">
                    {order.items.reduce((sum, item) => sum + item.qty, 0)} plant(s)
                  </td>
                  <td className="px-5 py-3.5 font-bold text-forest-950">{formatINR(order.total)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        order.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {order.payment_method === "cod" ? "COD" : "Online"} · {paymentStatusLabel(order.payment_status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusChip status={order.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-forest-900 shadow-sm transition hover:bg-forest-900 hover:text-white"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted">
                    <Package className="mx-auto mb-2 h-7 w-7 text-forest-400" />
                    <p className="font-semibold text-forest-950">No orders found</p>
                    <p className="text-xs">No orders match the selected filters or query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

