import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Home,
  Heart,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";
import {
  getAddresses,
  getBanners,
  getCategories,
  getAllProducts,
  getCustomerLoyalty,
  getOrdersForUser,
  getRecentlyViewed,
  getSettings,
  getWishlistProducts,
} from "@/lib/catalog";
import { OrderProgress } from "@/components/order-views";
import { ProductCard } from "@/components/product-card";
import { SafeImage } from "@/components/safe-image";
import { Badge, KpiCard, PaymentStatusChip, StatusChip, buttonClasses } from "@/components/ui";
import { formatINR, greeting, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function AccountDashboardPage() {
  // Prevent admin users from accessing user dashboard
  const currentUser = await requireUser("/account");
  if (await isAdmin()) {
    redirect("/admin");
  }
  const user = currentUser;
  const [orders, wishlist, recentlyViewed, addresses, settings, promos, categories, loyalty, livePlants] = await Promise.all([
    getOrdersForUser(user.id),
    getWishlistProducts(user.id),
    getRecentlyViewed(user.id, 4),
    getAddresses(user.id),
    getSettings(),
    getBanners("dashboard_promo"),
    getCategories(),
    getCustomerLoyalty(user.id),
    getAllProducts(),
  ]);

  const inTransit = orders.filter((order) => ["packed", "shipped"].includes(order.status)).length;
  const delivered = orders.filter((order) => order.status === "delivered").length;
  const activeOrder = orders.find((order) => !["delivered", "cancelled", "returned"].includes(order.status));
  const loyaltyPoints = user.loyalty_points;
  const redeemValue = settings.loyalty_enabled && settings.loyalty_redeem_rate > 0
    ? Math.floor((loyaltyPoints / settings.loyalty_redeem_rate) * 100)
    : 0;
  const promo = promos[0] ?? null;
  const wishlistIds = new Set(wishlist.map((product) => product.id));
  const latestTransactions = loyalty.slice(0, 3);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-forest-900 p-5 text-white shadow-card sm:p-6">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/5" aria-hidden />
        <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-amber/10" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-200">
              {greeting()}, {user.full_name.split(" ")[0]}
            </p>
            <h1 className="display-title mt-1.5 max-w-md text-balance text-[24px] font-semibold leading-tight sm:text-[30px]">
              Your little green world, all in one place.
            </h1>
            <p className="mt-2 max-w-md text-[11.5px] leading-relaxed text-white/60">
              {activeOrder
                ? `Order ${activeOrder.order_number} is ${activeOrder.status}. We'll keep you posted at every step.`
                : "Your plants are happy, your wishlist is ready, and your next leafy favourite is a tap away."}
            </p>
          </div>
          {settings.loyalty_enabled ? (
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-200">
                <Sparkles className="h-3 w-3" /> Leaf points
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">{loyaltyPoints}</p>
              <p className="text-[10px] text-white/55">Worth {formatINR(redeemValue)}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-200">
                <ShieldCheck className="h-3 w-3" /> Plant cover
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">{settings.return_window_days} days</p>
              <p className="text-[10px] text-white/55">On every order</p>
            </div>
          )}
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link href="/" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11.5px] font-semibold text-white transition hover:bg-white/20">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link href="/account/notifications" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-[11.5px] font-semibold text-white transition hover:bg-white/20">
            <Bell className="h-4 w-4" /> Notifications
          </Link>
          <Link href="/shop" className={buttonClasses({ variant: "amber", size: "sm" })}>
            Shop plants <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/account/orders" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-[11.5px] font-semibold text-white/90 transition hover:bg-white/10">
            My orders
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Total orders" value={orders.length} helper="Lifetime with Leaf & Pot" icon={Package} tone="green" />
        <KpiCard label="In transit" value={inTransit} helper="Packed or on the way" icon={Truck} tone="blue" />
        <KpiCard label="Delivered" value={delivered} helper="Plants safely home" icon={Sprout} tone="violet" />
        {settings.loyalty_enabled ? (
          <KpiCard label="Leaf points" value={loyaltyPoints} helper={`Worth ${formatINR(redeemValue)}`} icon={Wallet} tone="amber" />
        ) : (
          <KpiCard label="Saved plants" value={wishlist.length} helper="Waiting in your wishlist" icon={Heart} tone="amber" />
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {activeOrder ? (
            <section className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="eyebrow mb-1">Latest order</p>
                  <h2 className="font-display text-lg font-semibold text-forest-950">{activeOrder.order_number}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={activeOrder.status} />
                  <PaymentStatusChip status={activeOrder.payment_status} />
                </div>
              </div>
              <div className="mt-4">
                <OrderProgress status={activeOrder.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
                <div className="flex items-center gap-2">
                  {activeOrder.items.slice(0, 3).map((item) => (
                    <span key={item.id} className="relative h-10 w-9 overflow-hidden rounded-lg bg-leaf-mint">
                      <SafeImage src={item.image} alt="" sizes="36px" />
                    </span>
                  ))}
                  <span className="text-[11px] text-muted">
                    {activeOrder.items.length} item{activeOrder.items.length === 1 ? "" : "s"} · {formatINR(activeOrder.total)}
                  </span>
                </div>
                <Link href={`/account/orders/${activeOrder.id}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  View order <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          ) : (
            <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-soft text-forest-700">
                  <Sprout className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-forest-950">Ready for something new?</p>
                  <p className="text-[11.5px] text-muted">No active orders. Your next plant is waiting.</p>
                </div>
              </div>
              <Link href="/shop" className={buttonClasses({ size: "sm" })}>
                Browse plants <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Grow your collection</p>
                <h2 className="font-display text-[20px] font-semibold text-forest-950">Your wishlist</h2>
              </div>
              <Link href="/account/wishlist" className="text-[11.5px] font-semibold text-forest-700 hover:underline">
                View all ({wishlist.length})
              </Link>
            </div>
            {wishlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center">
                <Heart className="mx-auto h-6 w-6 text-forest-400" />
                <p className="mt-2 text-[13px] font-semibold text-forest-950">Nothing saved yet</p>
                <p className="mt-1 text-[11.5px] text-muted">Tap the heart on a plant to keep it here.</p>
                <Link href="/shop" className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-3" })}>
                  Find a plant
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {wishlist.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} wishlisted={wishlistIds.has(product.id)} loggedIn compact />
                ))}
              </div>
            )}
          </section>

          {/* Live Nursery Plants Collection */}
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Live from our botanical nursery</p>
                <h2 className="font-display text-[20px] font-semibold text-forest-950">Recommended Live Plants</h2>
              </div>
              <Link href="/shop" className="text-[11.5px] font-semibold text-forest-700 hover:underline">
                Explore all ({livePlants.length}) →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {livePlants.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlisted={wishlistIds.has(product.id)}
                  loggedIn
                  compact
                />
              ))}
            </div>
          </section>

          {recentlyViewed.length > 0 && (
            <section className="card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[18px] font-semibold text-forest-950">Recently viewed</h2>
                <Link href="/shop" className="text-[11px] font-semibold text-forest-700 hover:underline">
                  Shop all
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-line">
                {recentlyViewed.map((product) => {
                  const price = product.variants.find((variant) => variant.is_active)?.price ?? 0;
                  return (
                    <li key={product.id}>
                      <Link href={`/product/${product.slug}`} className="flex items-center gap-3 py-2.5 transition hover:opacity-80">
                        <span className="relative h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                          <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="40px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-semibold text-forest-950">{product.name}</span>
                          <span className="block text-[10.5px] text-muted">{product.category_name}</span>
                        </span>
                        <span className="text-[12px] font-semibold text-forest-900">{formatINR(price)}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {promo && (
            <div className="relative overflow-hidden rounded-2xl bg-forest-900 p-5 text-white shadow-card">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5" aria-hidden />
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-forest-200">
                {promo.eyebrow ?? "Special offer"}
              </p>
              <h2 className="display-title mt-2 max-w-[16ch] text-[21px] font-semibold leading-tight">{promo.title}</h2>
              {promo.subtitle && <p className="mt-2 text-[11.5px] leading-relaxed text-white/60">{promo.subtitle}</p>}
              <Link href={promo.cta_url ?? "/shop"} className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[11px] font-semibold text-forest-900 hover:bg-forest-50">
                {promo.cta_label ?? "Shop now"} <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <div className="card p-4">
            <h2 className="font-display text-[17px] font-semibold text-forest-950">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { href: "/account/orders", label: "My orders", icon: Package },
                { href: "/account/wishlist", label: "Wishlist", icon: Heart },
                { href: "/account/addresses", label: "Addresses", icon: MapPin },
                { href: settings.loyalty_enabled ? "/account/loyalty" : "/account/settings", label: settings.loyalty_enabled ? "Loyalty" : "Settings", icon: settings.loyalty_enabled ? Sparkles : ShieldCheck },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col gap-2 rounded-xl border border-line p-3 text-[11.5px] font-medium text-forest-900 transition hover:border-forest-300 hover:bg-leaf-mint"
                >
                  <action.icon className="h-4 w-4 text-forest-600" />
                  {action.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[10.5px] text-muted">
              <MapPin className="h-3 w-3" />
              {addresses.length ? `${addresses.length} saved address${addresses.length === 1 ? "" : "es"}` : "No address saved yet"}
            </p>
          </div>

          {settings.loyalty_enabled && latestTransactions.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[17px] font-semibold text-forest-950">Points activity</h2>
                <Link href="/account/loyalty" className="text-[10.5px] font-semibold text-forest-700 hover:underline">
                  View all
                </Link>
              </div>
              <ul className="mt-3 space-y-2.5">
                {latestTransactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-start justify-between gap-2 text-[11.5px]">
                    <span className="text-muted">{transaction.note ?? transaction.type}</span>
                    <span className={transaction.points >= 0 ? "font-semibold text-success-ink" : "font-semibold text-danger"}>
                      {transaction.points >= 0 ? "+" : ""}
                      {transaction.points}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-forest-100 bg-leaf-mint p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-700">
              <Sprout className="h-3.5 w-3.5" /> Plant care tip
            </p>
            <p className="mt-2 text-[12px] font-semibold text-forest-950">Water less than you think.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Most houseplants prefer slightly dry soil over soggy roots. Check the top two inches before watering.
            </p>
            <Link href="/about#care" className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 hover:underline">
              More care guides <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="card p-4">
            <h2 className="font-display text-[17px] font-semibold text-forest-950">Shop by room</h2>
            <ul className="mt-2.5">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link
                    href={category.slug === "best-sellers" ? "/shop?sort=rating" : `/category/${category.slug}`}
                    className="flex items-center gap-2 rounded-lg py-1.5 text-[11.5px] text-forest-900 transition hover:text-forest-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-forest-400" />
                    <span className="flex-1 truncate">{category.name}</span>
                    <span className="text-[10px] text-muted">{category.product_count ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <p className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted">
        <Badge tone="green">Green Home, Happy You</Badge>
        Signed in as {user.email} · Member since {user.created_at ? timeAgo(user.created_at) : "today"}
      </p>
    </div>
  );
}
