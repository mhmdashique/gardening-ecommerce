import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  IndianRupee,
  Layers,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminProducts, getAdminReturns, getAdminStats, getAllOrders } from "@/lib/catalog";
import { SafeImage } from "@/components/safe-image";
import { PaymentStatusChip, StatusChip } from "@/components/ui";
import { minPrice, totalStock } from "@/lib/product-utils";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard | Botanical Control", robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const [stats, orders, products, returns] = await Promise.all([
    getAdminStats(),
    getAllOrders(),
    getAdminProducts(),
    getAdminReturns(),
  ]);

  const pending = orders.filter((order) => ["processing", "packed"].includes(order.status)).slice(0, 6);
  const lowStock = products
    .flatMap((product) =>
      product.variants
        .filter((variant) => variant.is_active && variant.stock <= variant.low_stock_threshold)
        .map((variant) => ({ product, variant })),
    )
    .sort((a, b) => a.variant.stock - b.variant.stock)
    .slice(0, 6);

  const openReturns = returns.filter((request) => request.status === "requested").length;
  const maxRevenue = Math.max(1, ...stats.revenueByDay.map((day) => day.revenue));
  const thisWeek = stats.revenueByDay.reduce((sum, day) => sum + day.revenue, 0);
  const totalCustomers = orders.length ? new Set(orders.map((o) => o.customer_email || o.user_id)).size : 0;
  const activeProducts = products.filter((p) => p.is_active);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/30 bg-gradient-to-br from-[#0a1a12] via-[#0f281d] to-[#08150f] p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-teal-500/10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/60 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Nursery Storefront Live &amp; Operational
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Botanical Command Center
            </h1>
            <p className="max-w-xl text-xs text-white/70 sm:text-sm">
              Live telemetry for Leaf &amp; Pot nursery. Track inbound orders, monitor greenhouse inventory, and oversee botanical dispatches in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-400 hover:to-teal-400 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add New Plant
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <Package className="h-4 w-4 text-emerald-300" /> View Orders
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
              title="Open storefront"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue Today */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-b from-white to-emerald-50/30 p-5 shadow-sm transition hover:shadow-md hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Revenue Today</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:scale-110">
              <IndianRupee className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest-950 sm:text-3xl">
            {formatINR(stats.revenueToday)}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <Flame className="h-3.5 w-3.5 text-emerald-600" /> {stats.ordersToday} order{stats.ordersToday === 1 ? "" : "s"} today
            </span>
            <span className="text-muted">Live sync</span>
          </div>
        </div>

        {/* Pending Dispatch */}
        <div className="group relative overflow-hidden rounded-2xl border border-blue-900/10 bg-gradient-to-b from-white to-blue-50/30 p-5 shadow-sm transition hover:shadow-md hover:border-blue-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Pending Dispatch</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:scale-110">
              <Truck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest-950 sm:text-3xl">
            {stats.pendingDispatch}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
              <Clock className="h-3.5 w-3.5" /> Processing / Packed
            </span>
            <Link href="/admin/orders?status=processing" className="font-semibold text-blue-600 hover:underline">
              Fulfill &rarr;
            </Link>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-900/10 bg-gradient-to-b from-white to-amber-50/30 p-5 shadow-sm transition hover:shadow-md hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Inventory Alerts</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 transition group-hover:scale-110">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest-950 sm:text-3xl">
            {stats.lowStock}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
              Variants low / out
            </span>
            <Link href="/admin/products?status=low" className="font-semibold text-amber-600 hover:underline">
              Restock &rarr;
            </Link>
          </div>
        </div>

        {/* 7-Day Performance */}
        <div className="group relative overflow-hidden rounded-2xl border border-purple-900/10 bg-gradient-to-b from-white to-purple-50/30 p-5 shadow-sm transition hover:shadow-md hover:border-purple-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">Past 7 Days</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:scale-110">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest-950 sm:text-3xl">
            {formatINR(thisWeek)}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
              Weekly Run Rate
            </span>
            <span className="text-muted">7 days total</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Analytics & Dispatch Queue vs Right Sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Revenue Bar Chart Section */}
          <section className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Revenue Analytics</p>
                <h2 className="font-display text-xl font-bold text-forest-950">Last 7 Days Revenue Trend</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted">Weekly Total</p>
                  <p className="font-display text-base font-bold text-forest-950">{formatINR(thisWeek)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">
              {stats.revenueByDay.map((day) => {
                const height = Math.max(6, Math.round((day.revenue / maxRevenue) * 100));
                const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                return (
                  <div key={day.date} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[9px] font-bold text-forest-700 opacity-0 transition group-hover:opacity-100 sm:text-[10px]">
                      {day.revenue > 0 ? formatINR(day.revenue) : "₹0"}
                    </span>
                    <div className="relative w-full overflow-hidden rounded-t-xl bg-forest-100">
                      <div
                        className={`w-full transition-all duration-500 rounded-t-xl ${
                          isToday
                            ? "bg-gradient-to-t from-emerald-700 via-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20"
                            : "bg-gradient-to-t from-forest-800 to-forest-600 group-hover:from-emerald-700 group-hover:to-emerald-500"
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${formatINR(day.revenue)} · ${day.orders} order(s)`}
                      />
                    </div>
                    <div className="text-center">
                      <span className={`block text-[10px] font-semibold ${isToday ? "text-emerald-700 font-bold" : "text-muted"}`}>
                        {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <span className="block text-[8px] text-muted/70">{day.orders} ord</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pending Dispatch Orders Table */}
          <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-line bg-surface-subtle/50 px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-forest-950">Awaiting Dispatch</h2>
                <p className="text-[11px] text-muted">Orders marked as processing or packed needing greenhouse dispatch</p>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
              >
                View all orders <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle/20 text-[10px] uppercase tracking-wider text-muted font-bold">
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Placed</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pending.map((order) => (
                    <tr key={order.id} className="transition hover:bg-emerald-50/20">
                      <td className="px-5 py-3.5 font-bold text-forest-950">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                            {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : "C"}
                          </span>
                          <div>
                            <p className="font-semibold text-forest-950">{order.customer_name}</p>
                            <p className="text-[10px] text-muted">{order.address?.city || order.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-3.5 font-bold text-forest-950">{formatINR(order.total)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusChip status={order.status} />
                          <PaymentStatusChip status={order.payment_status} />
                        </div>
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
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted">
                        <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                        <p className="font-semibold text-forest-950">No pending dispatches</p>
                        <p className="text-xs">All current orders have been dispatched or delivered.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Active Nursery Plants Botanical Showcase */}
          <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Greenhouse Showcase</p>
                <h2 className="font-display text-lg font-bold text-forest-950">
                  Live Botanical Catalog ({products.length} plants)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center gap-1 rounded-xl bg-forest-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-forest-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Plant
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-forest-800 transition hover:bg-emerald-50"
                >
                  Full Inventory &rarr;
                </Link>
              </div>
            </div>

            <div className="mt-4 divide-y divide-line/70">
              {products.slice(0, 8).map((plant) => (
                <div key={plant.id} className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-surface-subtle/30 rounded-xl px-2">
                  <div className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-emerald-50 shadow-sm">
                      <SafeImage
                        src={plant.images[0] ?? "/images/plant-placeholder.svg"}
                        alt={plant.name}
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-forest-950">{plant.name}</p>
                        {plant.is_active ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                            Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-muted">
                        {plant.category_name} · From <strong className="text-forest-900">{formatINR(minPrice(plant))}</strong> · Stock: {totalStock(plant)} units
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {plant.variants.map((v) => (
                      <span key={v.id} className="rounded-lg border border-line bg-surface-subtle px-2 py-0.5 text-[10px]">
                        <strong className="text-forest-950">{v.size}:</strong> {formatINR(v.price)}{" "}
                        <span className="text-muted">({v.stock})</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${plant.slug}`}
                      target="_blank"
                      className="rounded-lg border border-line px-2.5 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-emerald-50 transition"
                    >
                      Live View ↗
                    </Link>
                    <Link
                      href={`/admin/products/${plant.id}`}
                      className="rounded-lg bg-forest-900 px-3 py-1 text-[10.5px] font-semibold text-white hover:bg-forest-800 transition"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Sellers & Low Stock Side-by-side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-forest-950">Top Selling Botanical</h3>
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <ul className="mt-3 space-y-3">
                {stats.topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-100 text-[10px] font-bold text-emerald-800">
                      #{index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-forest-950">{product.name}</span>
                      <span className="block text-[10px] text-muted">{product.units} units fulfilled</span>
                    </span>
                    <span className="text-xs font-bold text-forest-950">{formatINR(product.revenue)}</span>
                  </li>
                ))}
                {stats.topProducts.length === 0 && <li className="text-xs text-muted">No sales telemetry yet.</li>}
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-forest-950">Critical Stock Levels</h3>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <ul className="mt-3 space-y-2.5">
                {lowStock.map(({ product, variant }) => (
                  <li key={variant.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-forest-950">{product.name}</span>
                      <span className="block text-[10px] text-muted">{variant.size} · SKU: {variant.sku}</span>
                    </div>
                    <span className={variant.stock === 0 ? "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700" : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"}>
                      {variant.stock === 0 ? "Out of stock" : `${variant.stock} left`}
                    </span>
                  </li>
                ))}
                {lowStock.length === 0 && <li className="text-xs text-muted">All botanical inventory healthy.</li>}
              </ul>
              <Link href="/admin/products" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline">
                Manage all stock <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Executive Sidebar */}
        <aside className="space-y-6">
          {/* Store Health Radar */}
          <section className="relative overflow-hidden rounded-3xl border border-emerald-900/30 bg-gradient-to-b from-[#0d2218] to-[#08150f] p-5 text-white shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                <ShoppingBag className="h-3.5 w-3.5" /> Store Health
              </p>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Customers</p>
                <p className="mt-1 font-display text-xl font-bold text-white">{totalCustomers}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Active Plants</p>
                <p className="mt-1 font-display text-xl font-bold text-white">{activeProducts.length}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Total Orders</p>
                <p className="mt-1 font-display text-xl font-bold text-white">{orders.length}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Open Returns</p>
                <p className="mt-1 font-display text-xl font-bold text-amber-300">{openReturns}</p>
              </div>
            </div>

            <Link
              href="/admin/returns"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Review Return Claims <ArrowRight className="h-3 w-3" />
            </Link>
          </section>

          {/* Orders by Status */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-bold text-forest-950">Fulfillment Pipeline</h3>
            <p className="text-[11px] text-muted">Current status breakdown across all orders</p>
            
            <ul className="mt-3 space-y-1.5">
              {stats.ordersByStatus.map((row) => (
                <li key={row.status}>
                  <Link
                    href={`/admin/orders?status=${row.status}`}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition hover:bg-emerald-50"
                  >
                    <span className="capitalize font-medium text-forest-900">{row.status}</span>
                    <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-[10px] font-bold text-forest-900">
                      {row.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Quick Hub Navigation */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-bold text-forest-950">Management Hub</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { href: "/admin/products", label: "Catalog", icon: Boxes, desc: "Inventory" },
                { href: "/admin/orders", label: "Orders", icon: Package, desc: "Fulfillment" },
                { href: "/admin/categories", label: "Categories", icon: Layers, desc: "Taxonomy" },
                { href: "/admin/coupons", label: "Coupons", icon: Tag, desc: "Discounts" },
                { href: "/admin/customers", label: "Customers", icon: Users, desc: "Directory" },
                { href: "/admin/settings", label: "Settings", icon: RefreshCw, desc: "Store config" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col gap-1 rounded-2xl border border-line p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <link.icon className="h-4 w-4 text-emerald-700 transition group-hover:scale-110" />
                  <p className="text-xs font-bold text-forest-950">{link.label}</p>
                  <p className="text-[9.5px] text-muted">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

