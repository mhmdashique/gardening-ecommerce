import type { Metadata } from "next";
import Link from "next/link";
import { Award, IndianRupee, Repeat, Search, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminCustomers, getAllOrders } from "@/lib/catalog";
import { CustomerTableWithDrawer } from "@/components/customer-table";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Customer Directory & Patron Accounts | Admin", robots: { index: false, follow: false } };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/customers");
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.toLowerCase().trim() ?? "";

  const [customers, orders] = await Promise.all([getAdminCustomers(), getAllOrders()]);
  const filtered = customers.filter(
    (customer) =>
      !q || `${customer.full_name} ${customer.email} ${customer.phone ?? ""}`.toLowerCase().includes(q),
  );
  const spendByUser = new Map<string, { spend: number; orders: number }>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const current = spendByUser.get(order.user_id) ?? { spend: 0, orders: 0 };
    current.spend += order.total;
    current.orders += 1;
    spendByUser.set(order.user_id, current);
  }
  const totalSpend = [...spendByUser.values()].reduce((sum, value) => sum + value.spend, 0);
  const repeatBuyers = [...spendByUser.values()].filter((value) => value.orders > 1).length;
  const loyaltyCount = customers.filter((customer) => customer.loyalty_points > 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Customer Directory</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {customers.length} Patrons
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Manage registered botanical accounts, review lifetime patron value, and inspect order histories.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Registered Patrons</span>
            <Users className="h-4 w-4 text-forest-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">
            {customers.filter((c) => c.role === "customer").length}
          </p>
          <p className="mt-1 text-[11px] text-muted">Active consumer accounts</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Repeat Buyers</span>
            <Repeat className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-blue-950">{repeatBuyers}</p>
          <p className="mt-1 text-[11px] text-blue-700">Placed 2 or more orders</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Lifetime Gross</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-950">{formatINR(totalSpend)}</p>
          <p className="mt-1 text-[11px] text-emerald-700">Excludes cancelled orders</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Loyalty Club</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-950">{loyaltyCount}</p>
          <p className="mt-1 text-[11px] text-amber-700">Members with point balances</p>
        </div>
      </div>

      {/* Search Bar */}
      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm" method="get">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search customers</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by customer name, email address, or phone number..."
            className="input-base h-11 pl-10 text-xs"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          <Search className="h-3.5 w-3.5" /> Search
        </button>
        {q && (
          <Link
            href="/admin/customers"
            className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-forest-700 hover:bg-leaf-mint"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <CustomerTableWithDrawer customers={filtered} orders={orders} />
      </div>
    </div>
  );
}

