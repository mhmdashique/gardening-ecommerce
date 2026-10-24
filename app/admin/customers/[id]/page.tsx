import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminCustomers, getAllOrders } from "@/lib/catalog";
import { CustomerActions } from "@/components/admin-forms";
import { SafeImage } from "@/components/safe-image";
import { Badge, PaymentStatusChip, StatusChip } from "@/components/ui";
import { formatDate, formatDateTime, formatINR, initials, paymentStatusLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Customer Details", robots: { index: false, follow: false } };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/customers");
  const { id } = await params;

  const [customers, allOrders] = await Promise.all([getAdminCustomers(), getAllOrders()]);
  const customer = customers.find((c) => c.id === id);
  if (!customer) notFound();

  // Find customer's orders
  const customerOrders = allOrders.filter(
    (o) => o.user_id === customer.id || (o.customer_email && o.customer_email.toLowerCase() === customer.email.toLowerCase()),
  );

  const validOrders = customerOrders.filter((o) => o.status !== "cancelled");
  const totalSpend = validOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = customerOrders.length > 0 ? Math.round(totalSpend / customerOrders.length) : 0;
  const latestShipping = customerOrders.find((o) => o.address)?.address;

  return (
    <div className="space-y-5">
      {/* Top Header & Breadcrumb Back link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-800 text-sm font-bold text-white shadow-sm">
              {initials(customer.full_name)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-forest-950 sm:text-3xl">
                  {customer.full_name}
                </h1>
                <Badge tone={customer.is_blocked ? "red" : "green"}>
                  {customer.is_blocked ? "Blocked" : "Active"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted flex items-center gap-2">
                <span className="capitalize font-medium">{customer.role}</span>
                <span>·</span>
                <span>ID: {customer.id}</span>
                <span>·</span>
                <span>Joined {customer.created_at ? formatDate(customer.created_at) : "N/A"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CustomerActions customer={customer} />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Lifetime Spend</p>
          <p className="mt-1 font-display text-2xl font-bold text-forest-950">{formatINR(totalSpend)}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">Excluding cancellations</p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Total Orders</p>
          <p className="mt-1 font-display text-2xl font-bold text-forest-950">{customerOrders.length}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">{validOrders.length} fulfilled / active</p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Avg Order Value</p>
          <p className="mt-1 font-display text-2xl font-bold text-forest-950">{formatINR(avgOrderValue)}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">Per placed order</p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Loyalty Balance</p>
          <p className="mt-1 font-display text-2xl font-bold text-forest-950 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber" />
            {customer.loyalty_points} pts
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">Available store reward</p>
        </div>
      </div>

      {/* Main Grid: Orders & Contact */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: Orders List */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-lg font-semibold text-forest-950 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-forest-700" />
                Customer Orders ({customerOrders.length})
              </h2>
              <span className="text-xs text-muted">Lifetime purchases</span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-9 w-9 text-forest-400" />
                <p className="mt-2 text-sm font-semibold text-forest-950">No orders placed yet</p>
                <p className="mt-1 text-xs text-muted">
                  When this customer makes a purchase on the storefront, orders will display here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line pt-1">
                {customerOrders.map((order) => (
                  <div key={order.id} className="py-4 space-y-3 first:pt-3 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-sm text-forest-950 hover:text-forest-700 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-[10.5px] text-muted flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Placed {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip status={order.status} />
                        <PaymentStatusChip status={order.payment_status} />
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-forest-700 hover:underline"
                        >
                          Manage ↗
                        </Link>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 rounded-xl bg-leaf-mint/20 p-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs">
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white border border-line">
                            <SafeImage
                              src={item.image ?? "/images/plant-placeholder.svg"}
                              alt={item.name}
                              sizes="36px"
                              className="object-cover"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-forest-950 truncate">{item.name}</p>
                            {(item.pot_type || item.size) && (
                              <p className="text-[10px] text-muted truncate">
                                {item.pot_type ? item.pot_type : ""} {item.size ? `(${item.size})` : ""}
                              </p>
                            )}
                          </div>
                          <span className="text-muted shrink-0">×{item.qty}</span>
                          <span className="font-semibold text-forest-900 shrink-0">
                            {formatINR(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="flex items-center gap-1.5 text-muted text-[11px]">
                        <CreditCard className="h-3.5 w-3.5" />
                        {order.payment_method === "cod" ? "COD" : "Online"} ({paymentStatusLabel(order.payment_status)})
                      </span>
                      <span className="font-bold text-forest-950 text-sm">
                        Total: {formatINR(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer Profile & Delivery Address */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5 border-b border-line pb-2.5">
              <UserIcon className="h-3.5 w-3.5 text-forest-600" />
              Contact Details
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10.5px] uppercase font-semibold text-muted">Email</p>
                <a href={`mailto:${customer.email}`} className="mt-0.5 font-medium text-forest-900 hover:underline block truncate">
                  {customer.email}
                </a>
              </div>
              <div>
                <p className="text-[10.5px] uppercase font-semibold text-muted">Phone Number</p>
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="mt-0.5 font-medium text-forest-900 hover:underline block">
                    +91 {customer.phone}
                  </a>
                ) : (
                  <p className="mt-0.5 text-muted">Not registered</p>
                )}
              </div>
              <div>
                <p className="text-[10.5px] uppercase font-semibold text-muted">Account ID</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted truncate">{customer.id}</p>
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5 border-b border-line pb-2.5">
              <MapPin className="h-3.5 w-3.5 text-forest-600" />
              Delivery Destination
            </h2>

            {latestShipping ? (
              <div className="text-xs space-y-1">
                <p className="font-semibold text-forest-950">{latestShipping.name}</p>
                <p className="text-forest-800">{latestShipping.phone}</p>
                <p className="text-muted leading-relaxed">
                  {latestShipping.line1}
                  {latestShipping.line2 ? `, ${latestShipping.line2}` : ""}
                  <br />
                  {latestShipping.city}, {latestShipping.state} - {latestShipping.pincode}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">No address on file yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
