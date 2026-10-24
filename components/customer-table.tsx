"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { CustomerActions } from "@/components/admin-forms";
import { SafeImage } from "@/components/safe-image";
import { Badge, StatusChip } from "@/components/ui";
import { cn, formatDate, formatDateTime, formatINR, initials, paymentStatusLabel } from "@/lib/utils";
import type { Order, User } from "@/lib/types";

export interface CustomerWithStats extends User {
  stats: {
    spend: number;
    orders: number;
  };
}

export function CustomerTableWithDrawer({
  customers,
  orders,
}: {
  customers: User[];
  orders: Order[];
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  // Group orders by user_id and email
  const ordersByUser = new Map<string, Order[]>();
  for (const order of orders) {
    // Key by user_id
    const byId = ordersByUser.get(order.user_id) ?? [];
    byId.push(order);
    ordersByUser.set(order.user_id, byId);

    // Also key by email lowercase for fallback
    if (order.customer_email) {
      const emailKey = order.customer_email.toLowerCase();
      const byEmail = ordersByUser.get(emailKey) ?? [];
      if (!byEmail.some((o) => o.id === order.id)) {
        byEmail.push(order);
        ordersByUser.set(emailKey, byEmail);
      }
    }
  }

  // Calculate stats map
  const spendByUser = new Map<string, { spend: number; orders: number }>();
  for (const customer of customers) {
    const custOrders = ordersByUser.get(customer.id) ?? ordersByUser.get(customer.email.toLowerCase()) ?? [];
    const validOrders = custOrders.filter((o) => o.status !== "cancelled");
    const spend = validOrders.reduce((sum, o) => sum + o.total, 0);
    spendByUser.set(customer.id, { spend, orders: custOrders.length });
  }

  // Close drawer on escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCustomer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeCustomerOrders = selectedCustomer
    ? ordersByUser.get(selectedCustomer.id) ?? ordersByUser.get(selectedCustomer.email.toLowerCase()) ?? []
    : [];

  const activeCustomerStats = selectedCustomer
    ? spendByUser.get(selectedCustomer.id) ?? { spend: 0, orders: 0 }
    : { spend: 0, orders: 0 };

  const latestShippingAddress = activeCustomerOrders.find((o) => o.address)?.address;

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
              <th className="px-3.5 py-3 font-semibold">Customer</th>
              <th className="px-3.5 py-3 font-semibold">Contact</th>
              <th className="px-3.5 py-3 font-semibold">Joined</th>
              <th className="px-3.5 py-3 font-semibold">Orders</th>
              <th className="px-3.5 py-3 font-semibold">Lifetime Spend</th>
              <th className="px-3.5 py-3 font-semibold">Points</th>
              <th className="px-3.5 py-3 font-semibold">Status</th>
              <th className="px-3.5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => {
              const stats = spendByUser.get(customer.id) ?? { spend: 0, orders: 0 };
              const isSelected = selectedCustomer?.id === customer.id;

              return (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    isSelected ? "bg-leaf-soft/70" : "hover:bg-leaf-mint/40",
                  )}
                >
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-leaf-soft text-[10.5px] font-bold text-forest-800 ring-2 ring-transparent group-hover:ring-forest-200">
                        {initials(customer.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-forest-950 group-hover:text-forest-700 transition-colors">
                          {customer.full_name}
                        </p>
                        <p className="text-[10px] capitalize text-muted">{customer.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <p className="text-forest-900 font-medium">{customer.email}</p>
                    <p className="text-[10.5px] text-muted">{customer.phone ?? "No phone"}</p>
                  </td>
                  <td className="px-3.5 py-3 text-muted">
                    {customer.created_at ? formatDate(customer.created_at) : "—"}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 font-semibold text-forest-900">
                      <Package className="h-3 w-3 text-forest-600" />
                      {stats.orders}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-semibold text-forest-950">
                    {formatINR(stats.spend)}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="inline-flex items-center gap-1 text-forest-900">
                      <Sparkles className="h-3 w-3 text-amber" />
                      {customer.loyalty_points}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <Badge tone={customer.is_blocked ? "red" : "green"}>
                      {customer.is_blocked ? "Blocked" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-3.5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center gap-1 rounded-lg bg-leaf-mint px-2 py-1 text-[11px] font-semibold text-forest-800 hover:bg-forest-100 transition"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <CustomerActions customer={customer} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3.5 py-12 text-center text-muted">
                  No customers found matching this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Customer Details Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl animate-slide-left flex flex-col">
              {/* Drawer Top Header */}
              <div className="border-b border-line bg-leaf-mint/30 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-800 text-sm font-bold text-white shadow-sm">
                      {initials(selectedCustomer.full_name)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-bold text-forest-950">
                          {selectedCustomer.full_name}
                        </h2>
                        <Badge tone={selectedCustomer.is_blocked ? "red" : "green"}>
                          {selectedCustomer.is_blocked ? "Blocked" : "Active Account"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted flex items-center gap-2">
                        <span className="capitalize font-medium">{selectedCustomer.role}</span>
                        <span>·</span>
                        <span>ID: {selectedCustomer.id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/customers/${selectedCustomer.id}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-leaf-mint hover:text-forest-900 transition"
                      title="Open full page"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-leaf-mint hover:text-forest-900 transition"
                      aria-label="Close drawer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-forest-100/70 pt-3">
                  <p className="text-[11px] text-muted">
                    Joined on {selectedCustomer.created_at ? formatDate(selectedCustomer.created_at) : "N/A"}
                  </p>
                  <CustomerActions customer={selectedCustomer} />
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-line bg-leaf-cream/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Total Spend</p>
                    <p className="mt-1 font-display text-lg font-bold text-forest-950">
                      {formatINR(activeCustomerStats.spend)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-leaf-cream/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Orders Count</p>
                    <p className="mt-1 font-display text-lg font-bold text-forest-950">
                      {activeCustomerStats.orders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-leaf-cream/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Avg Order Value</p>
                    <p className="mt-1 font-display text-lg font-bold text-forest-950">
                      {activeCustomerStats.orders > 0
                        ? formatINR(Math.round(activeCustomerStats.spend / activeCustomerStats.orders))
                        : "₹0"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-leaf-cream/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Loyalty Balance</p>
                    <p className="mt-1 font-display text-lg font-bold text-forest-950 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber" />
                      {selectedCustomer.loyalty_points} pts
                    </p>
                  </div>
                </div>

                {/* Contact & Address Information */}
                <div className="rounded-2xl border border-line bg-white p-4 space-y-3 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-forest-600" />
                    Customer Information
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 text-[12px]">
                    <div className="flex items-center gap-2 text-forest-900">
                      <Mail className="h-4 w-4 text-forest-500 shrink-0" />
                      <a href={`mailto:${selectedCustomer.email}`} className="hover:underline truncate">
                        {selectedCustomer.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-forest-900">
                      <Phone className="h-4 w-4 text-forest-500 shrink-0" />
                      {selectedCustomer.phone ? (
                        <a href={`tel:${selectedCustomer.phone}`} className="hover:underline">
                          +91 {selectedCustomer.phone}
                        </a>
                      ) : (
                        <span className="text-muted">No phone provided</span>
                      )}
                    </div>
                  </div>

                  {latestShippingAddress && (
                    <div className="mt-3 border-t border-line/80 pt-3">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-forest-600" />
                        Default Shipping Destination
                      </p>
                      <p className="mt-1 text-[12px] text-forest-900 font-medium">
                        {latestShippingAddress.name} · {latestShippingAddress.phone}
                      </p>
                      <p className="text-[11.5px] text-muted">
                        {latestShippingAddress.line1}
                        {latestShippingAddress.line2 ? `, ${latestShippingAddress.line2}` : ""},{" "}
                        {latestShippingAddress.city}, {latestShippingAddress.state} - {latestShippingAddress.pincode}
                      </p>
                    </div>
                  )}
                </div>

                {/* Orders Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-forest-950 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-forest-700" />
                      Order History ({activeCustomerOrders.length})
                    </h3>
                    <span className="text-[11px] text-muted">
                      {activeCustomerOrders.filter((o) => o.status !== "cancelled").length} fulfilled / active
                    </span>
                  </div>

                  {activeCustomerOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-line bg-leaf-mint/20 p-8 text-center">
                      <Package className="mx-auto h-8 w-8 text-forest-400" />
                      <p className="mt-2 text-xs font-semibold text-forest-950">No orders placed yet</p>
                      <p className="mt-1 text-[11px] text-muted">
                        When this customer places an order on the storefront, it will appear here with full item breakdowns.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCustomerOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-forest-300"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                            <div>
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="font-semibold text-[13px] text-forest-950 hover:text-forest-700 hover:underline"
                              >
                                {order.order_number}
                              </Link>
                              <p className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(order.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusChip status={order.status} />
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline"
                              >
                                Manage <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>

                          {/* Ordered Items Preview */}
                          <div className="mt-3 space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 text-[11.5px]">
                                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                                  <SafeImage
                                    src={item.image ?? "/images/plant-placeholder.svg"}
                                    alt={item.name}
                                    sizes="36px"
                                    className="object-cover"
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-forest-950">{item.name}</p>
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

                          {/* Order Footer Totals & Payment */}
                          <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5 text-[11px]">
                            <span className="flex items-center gap-1 text-muted">
                              <CreditCard className="h-3.5 w-3.5" />
                              {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
                              <span className="capitalize">({paymentStatusLabel(order.payment_status)})</span>
                            </span>
                            <span className="font-bold text-forest-950 text-[12.5px]">
                              Total: {formatINR(order.total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
