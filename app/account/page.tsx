import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  HelpCircle,
  Info,
  Leaf,
  Mail,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { isAdmin, requireUser } from "@/lib/auth";
import {
  getAllProducts,
  getBanners,
  getCategories,
  getCustomerLoyalty,
  getOrdersForUser,
  getRecentlyViewed,
  getSettings,
  getWishlistProducts,
} from "@/lib/catalog";
import { OrderProgress } from "@/components/order-views";
import { MobileLogoutButton, MobileMenuGroup } from "@/components/mobile-menu";
import { ProductCard } from "@/components/product-card";
import { SafeImage } from "@/components/safe-image";
import { Badge, PaymentStatusChip, StatusChip } from "@/components/ui";
import { cn, formatINR, formatNumber, formatDate, greeting, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const quickActions = [
  { label: "Track Order", sub: "Delivery status", href: "/account/orders", icon: Package, tone: "bg-leaf-soft text-forest-700" },
  { label: "Browse Plants", sub: "Explore the collection", href: "/shop", icon: Leaf, tone: "bg-sky-soft text-sky-ink" },
  { label: "Manage Address", sub: "Delivery addresses", href: "/account/addresses", icon: MapPin, tone: "bg-violet-soft text-violet-ink" },
  { label: "Get Help", sub: "FAQs & support", href: "/contact", icon: HelpCircle, tone: "bg-amber-soft text-amber-ink" },
];

export default async function AccountDashboardPage() {
  // Prevent admin users from accessing user dashboard
  const user = await requireUser("/account");
  if (await isAdmin()) {
    redirect("/admin");
  }

  const [orders, wishlist, recentlyViewed, settings, promos, categories, loyalty, livePlants] = await Promise.all([
    getOrdersForUser(user.id),
    getWishlistProducts(user.id),
    getRecentlyViewed(user.id, 4),
    getSettings(),
    getBanners("dashboard_promo"),
    getCategories(),
    getCustomerLoyalty(user.id),
    getAllProducts(),
  ]);

  const activeOrder = orders.find((order) => !["delivered", "cancelled", "returned"].includes(order.status));
  const totalSpent = orders
    .filter((order) => !["cancelled", "returned"].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);
  const promo = promos[0] ?? null;
  const wishlistIds = new Set(wishlist.map((product) => product.id));
  const latestTransactions = loyalty.slice(0, 3);
  const redeemValue =
    settings.loyalty_enabled && settings.loyalty_redeem_rate > 0
      ? Math.floor((user.loyalty_points / settings.loyalty_redeem_rate) * 100)
      : 0;

  const stats = [
    { label: "Total Orders", value: formatNumber(orders.length), icon: ShoppingCart, tone: "bg-leaf-soft text-forest-700" },
    { label: "Wishlist Items", value: formatNumber(wishlist.length), icon: Heart, tone: "bg-danger-soft text-danger-ink" },
    { label: "Total Spent", value: formatINR(totalSpent), icon: Wallet, tone: "bg-sky-soft text-sky-ink" },
    settings.loyalty_enabled
      ? { label: "Reward Points", value: formatNumber(user.loyalty_points), icon: Star, tone: "bg-amber-soft text-amber-ink" }
      : { label: "Plant Cover", value: `${settings.return_window_days} days`, icon: ShieldCheck, tone: "bg-violet-soft text-violet-ink" },
  ];

  // The seeded dashboard promo points at /care-guide which has no route; land on the care section instead.
  const promoCtaHref =
    promo && (!promo.cta_url || promo.cta_url.startsWith("/care-guide")) ? "/about#care" : promo?.cta_url ?? "/about#care";

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Search (tablet & desktop) */}
      <form
        action="/shop"
        className="hidden h-11 items-center gap-2.5 rounded-2xl border border-line bg-white px-4 shadow-card sm:flex"
      >
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="search"
          name="q"
          placeholder="Search for plants, pots & more"
          aria-label="Search plants"
          className="h-full w-full bg-transparent text-[12.5px] font-medium text-forest-950 outline-none placeholder:text-muted/70"
        />
      </form>

      {/* Profile header (phone) */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-leaf-mint/80 via-white to-white p-4 shadow-card sm:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest-900 font-display text-lg font-semibold text-white shadow-soft">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[20px] font-semibold leading-tight text-forest-950">
              {user.full_name}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted">
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" /> {user.email}
              </span>
              {user.phone && <span>{user.phone}</span>}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="green">
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                {user.role === "admin" ? "Admin" : "Verified customer"}
              </Badge>
              {settings.loyalty_enabled && (
                <Badge tone="amber">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  {formatNumber(user.loyalty_points)} points
                </Badge>
              )}
              {user.created_at && (
                <span className="text-[10.5px] text-muted">Member since {formatDate(user.created_at)}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Greeting (tablet & desktop) */}
      <section className="relative hidden overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-leaf-mint/80 via-white to-white p-4 shadow-card sm:block sm:p-6">
        <Leaf
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-9 h-40 w-40 rotate-[28deg] text-forest-900/[0.05]"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[20px] font-semibold leading-tight text-forest-950 sm:text-[25px]">
              {greeting()}, {user.full_name.split(" ")[0]} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1.5 text-[12px] text-muted sm:text-[13px]">
              {"Here's what's happening with your orders and plants."}
            </p>
          </div>
          <p className="hidden rounded-xl border border-forest-100 bg-white/70 px-3.5 py-2 font-display text-[12px] italic text-forest-800 sm:block">
            A little green goes a long way
          </p>
        </div>
      </section>

      {/* Stats (tablet & desktop, 4 across) */}
      <section className="hidden grid-cols-4 gap-2.5 sm:grid sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col rounded-2xl border border-line bg-white p-2.5 shadow-card transition hover:border-forest-200 sm:p-4"
          >
            <span className={cn("grid h-8 w-8 place-items-center rounded-full sm:h-10 sm:w-10", stat.tone)}>
              <stat.icon className="h-4 w-4 sm:h-[19px] sm:w-[19px]" strokeWidth={1.8} />
            </span>
            <p className="mt-2 truncate text-[8.5px] font-semibold uppercase tracking-[0.12em] text-muted sm:text-[10px]">
              {stat.label}
            </p>
            <p className="mt-0.5 truncate font-display text-[14px] font-semibold tabular-nums tracking-tight text-forest-950 sm:mt-1 sm:text-[20px]">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Overview tiles + menu + logout (phone, reference layout) */}
      <section className="grid grid-cols-3 gap-2 sm:hidden sm:gap-4">
        {[
          { label: "Orders placed", value: formatNumber(orders.length), icon: Package, tone: "bg-leaf-soft text-forest-700" },
          { label: "Saved plants", value: formatNumber(wishlist.length), icon: Heart, tone: "bg-danger-soft text-danger-ink" },
          { label: "Total spent", value: formatINR(totalSpent), icon: Wallet, tone: "bg-sky-soft text-sky-ink" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white p-3 shadow-card">
            <span className={`grid h-8 w-8 place-items-center rounded-full ${stat.tone}`}>
              <stat.icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <p className="mt-2 truncate text-[8.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              {stat.label}
            </p>
            <p className="mt-0.5 truncate font-display text-[14px] font-semibold tabular-nums tracking-tight text-forest-950">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Account menu (phone, reference rows) */}
      <div className="sm:hidden">
        <MobileMenuGroup
          rows={[
            { href: "/account/profile/edit", icon: UserIcon, label: "Edit Profile", sub: "Update your personal details", tone: "bg-leaf-mint text-forest-700" },
            { href: "/account/orders", icon: Package, label: "My Orders", sub: "Track your orders", tone: "bg-leaf-mint text-forest-700" },
            { href: "/account/wishlist", icon: Heart, label: "Wishlist", sub: "Your saved items", tone: "bg-leaf-mint text-forest-700" },
            { href: "/account/addresses", icon: MapPin, label: "My Addresses", sub: "Manage delivery addresses", tone: "bg-leaf-mint text-forest-700" },
            { href: "/account/reviews", icon: Star, label: "My Reviews", sub: "Edit, update or delete your reviews", tone: "bg-leaf-mint text-forest-700" },
            { href: "/contact", icon: HelpCircle, label: "Help & Support", sub: "Get help, FAQs", tone: "bg-leaf-mint text-forest-700" },
            { href: "/about", icon: Info, label: "About Leaf & Pot", sub: "Who we are", tone: "bg-leaf-mint text-forest-700" },
          ]}
        />
        <div className="mt-3">
          <MobileLogoutButton />
        </div>
      </div>

      {/* Active order tracker (desktop & tablet only) */}
      {activeOrder && (
        <section className="card hidden p-4 sm:block sm:p-5">
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
            <Link
              href={`/account/orders/${activeOrder.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[11.5px] font-semibold text-forest-900 transition hover:border-forest-300 hover:bg-leaf-mint"
            >
              View order <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Recent orders (tablet & desktop) */}
      <section className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:block">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
          <h2 className="font-display text-[14px] font-semibold text-forest-950 sm:text-[16px]">Recent Orders</h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="flex items-center gap-1 text-[10.5px] font-semibold text-forest-700 hover:underline sm:text-[11.5px]"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Package className="mx-auto h-6 w-6 text-forest-400" />
            <p className="mt-2 text-[12.5px] font-semibold text-forest-950">No orders yet</p>
            <p className="text-[11px] text-muted">Your plant orders will show up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 5).map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
              return (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-2.5 px-4 py-3 transition hover:bg-leaf-mint/40 sm:gap-3 sm:px-5"
                  >
                    <span className="relative h-10 w-9 shrink-0 overflow-hidden rounded-xl bg-leaf-mint sm:hidden">
                      <SafeImage
                        src={order.items[0]?.image ?? "/images/plant-placeholder.svg"}
                        alt=""
                        sizes="36px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[11.5px] font-semibold tracking-tight text-forest-950">
                        {order.order_number}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted">
                        {formatDate(order.created_at, { day: "2-digit", month: "short" })} · {itemCount} item
                        {itemCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <StatusChip status={order.status} />
                    <span className="shrink-0 text-right text-[12px] font-semibold tracking-tight text-forest-950 sm:text-[13px]">
                      {formatINR(order.total)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Green rewards banner (tablet & desktop) */}
      {settings.loyalty_enabled && (
        <Link
          href="/account/loyalty"
          className="group relative hidden items-center gap-3.5 overflow-hidden rounded-2xl bg-forest-900 px-4 py-4 text-white shadow-soft sm:flex sm:px-5"
        >
          <span className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/[0.06]" aria-hidden />
          <span className="pointer-events-none absolute -bottom-16 right-20 h-28 w-28 rounded-full bg-amber/[0.08]" aria-hidden />
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-amber">
            <Sparkles className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[15px] font-semibold text-white">Green Rewards</span>
            <span className="block text-[10.5px] text-white/60">Earn points with every purchase!</span>
          </span>
          <span className="text-right">
            <span className="block font-display text-[19px] font-semibold tabular-nums leading-none">
              {formatNumber(user.loyalty_points)}
            </span>
            <span className="mt-1 block text-[9.5px] text-white/55">
              {redeemValue > 0 ? `Worth ${formatINR(redeemValue)}` : "pts collected"}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/70 transition group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Wishlist + quick actions: two cards on one line (tablet & desktop) */}
      <div className="hidden grid-cols-2 gap-2.5 sm:grid sm:gap-4">
        {/* Wishlist */}
        <section className="flex flex-col rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[13.5px] font-semibold text-forest-950 sm:text-[15px]">Wishlist</h2>
            <Link
              href="/account/wishlist"
              className="text-[10px] font-semibold text-forest-700 hover:underline sm:text-[11px]"
            >
              View All
            </Link>
          </div>
          {wishlist.length === 0 ? (
            <div className="mt-2.5 flex flex-1 flex-col items-center justify-center rounded-xl bg-forest-50/70 px-3 py-5 text-center">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-forest-300 shadow-sm">
                <Heart className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <p className="mt-2 text-[11px] font-semibold text-forest-950">Nothing saved yet</p>
              <p className="text-[10px] text-muted">Tap the heart on a plant you love.</p>
              <Link
                href="/shop"
                className="mt-2.5 inline-flex h-7 items-center gap-1 rounded-lg bg-forest-900 px-2.5 text-[10px] font-semibold text-white transition hover:bg-forest-800"
              >
                Find a plant <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <ul className="mt-2.5 flex-1 space-y-1.5 sm:space-y-2">
              {wishlist.slice(0, 3).map((product) => {
                const price = product.variants.find((variant) => variant.is_active)?.price ?? 0;
                return (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.slug}`}
                      className="flex items-center gap-2 rounded-xl bg-forest-50/70 p-1.5 transition hover:bg-leaf-mint"
                    >
                      <span className="relative h-9 w-8 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                        <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="34px" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-forest-950 sm:text-[11.5px]">
                          {product.name}
                        </span>
                        <span className="block text-[10px] text-muted">{formatINR(price)}</span>
                      </span>
                      <Heart className="h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.8} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section className="flex flex-col rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4">
          <h2 className="font-display text-[13.5px] font-semibold text-forest-950 sm:text-[15px]">Quick Actions</h2>
          <ul className="mt-2.5 flex-1 space-y-1.5 sm:space-y-2">
            {quickActions.map((action) => (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className="flex h-full items-center gap-2 rounded-xl bg-forest-50/70 p-1.5 transition hover:bg-leaf-mint"
                >
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9", action.tone)}>
                    <action.icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold text-forest-950 sm:text-[11.5px]">
                      {action.label}
                    </span>
                    <span className="hidden truncate text-[9.5px] text-muted sm:block">{action.sub}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Richer modules for tablet & desktop, hidden on mobile to keep it minimal */}
      <div className="hidden space-y-5 sm:block">
        {/* Recommended plants */}
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
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
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

        {/* Care promo split banner with image */}
        {promo && (
          <section className="card overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-stretch">
              <div className="flex-1 p-5 sm:p-6">
                <p className="eyebrow">{promo.eyebrow ?? "Special offer"}</p>
                <h2 className="font-display mt-1.5 text-[20px] font-semibold leading-tight text-forest-950 sm:text-[22px]">
                  {promo.title}
                </h2>
                {promo.subtitle && (
                  <p className="mt-1.5 max-w-md text-[11.5px] leading-relaxed text-muted">{promo.subtitle}</p>
                )}
                <Link
                  href={promoCtaHref}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-900 px-3.5 text-[11.5px] font-semibold text-white transition hover:bg-forest-800"
                >
                  {promo.cta_label ?? "Shop now"} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {promo.image_url && (
                <div className="relative min-h-[110px] w-full shrink-0 bg-leaf-mint sm:min-h-0 sm:w-[220px]">
                  <SafeImage src={promo.image_url} alt="" sizes="220px" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recently viewed + points activity: two cards on one line */}
        {(recentlyViewed.length > 0 || (settings.loyalty_enabled && latestTransactions.length > 0)) && (
          <div
            className={cn(
              "grid gap-3.5 sm:gap-4",
              recentlyViewed.length > 0 && settings.loyalty_enabled && latestTransactions.length > 0
                ? "sm:grid-cols-2"
                : "sm:grid-cols-1",
            )}
          >
            {recentlyViewed.length > 0 && (
              <section className="card p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[16px] font-semibold text-forest-950">Recently viewed</h2>
                  <Link href="/shop" className="text-[11px] font-semibold text-forest-700 hover:underline">
                    Shop all
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-line">
                  {recentlyViewed.map((product) => {
                    const price = product.variants.find((variant) => variant.is_active)?.price ?? 0;
                    return (
                      <li key={product.id}>
                        <Link
                          href={`/product/${product.slug}`}
                          className="flex items-center gap-3 py-2.5 transition hover:opacity-80"
                        >
                          <span className="relative h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                            <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="40px" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold text-forest-950">
                              {product.name}
                            </span>
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

            {settings.loyalty_enabled && latestTransactions.length > 0 && (
              <section className="card p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[16px] font-semibold text-forest-950">Points activity</h2>
                  <Link href="/account/loyalty" className="text-[10.5px] font-semibold text-forest-700 hover:underline">
                    View all
                  </Link>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {latestTransactions.map((transaction) => (
                    <li key={transaction.id} className="flex items-start justify-between gap-2 text-[11.5px]">
                      <span className="text-muted">{transaction.note ?? transaction.type}</span>
                      <span
                        className={
                          transaction.points >= 0 ? "font-semibold text-success-ink" : "font-semibold text-danger"
                        }
                      >
                        {transaction.points >= 0 ? "+" : ""}
                        {transaction.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Care tip + shop by room: two cards on one line */}
        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-2xl border border-forest-100 bg-leaf-mint/80 p-4 shadow-card sm:p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-forest-700 shadow-sm">
                <Sprout className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-700">Plant care tip</p>
            </div>
            <p className="font-display mt-3 text-[15px] font-semibold text-forest-950">Water less than you think.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-forest-900/70">
              Most houseplants prefer slightly dry soil over soggy roots. Check the top two inches before watering.
            </p>
            <Link
              href="/about#care"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 hover:underline"
            >
              More care guides <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-semibold text-forest-950">Shop by room</h2>
              <Link href="/shop" className="text-[10.5px] font-semibold text-forest-700 hover:underline">
                All collections
              </Link>
            </div>
            <ul className="mt-2.5">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={category.slug === "best-sellers" ? "/shop?sort=rating" : `/category/${category.slug}`}
                    className="group flex items-center gap-2.5 rounded-lg py-2 transition hover:bg-forest-50/70"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-forest-400 transition group-hover:bg-forest-600" />
                    <span className="flex-1 truncate text-[11.5px] font-medium text-forest-900">{category.name}</span>
                    <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[9px] font-semibold text-muted transition group-hover:bg-leaf-mint group-hover:text-forest-700">
                      {category.product_count ?? 0}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
