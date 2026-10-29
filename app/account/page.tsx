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
import { CardLabel, PremiumHero, StatTile, premiumSurface } from "@/components/premium";
import { MobileLogoutButton, MobileMenuGroup } from "@/components/mobile-menu";
import { ProductCard } from "@/components/product-card";
import { SafeImage } from "@/components/safe-image";
import { PaymentStatusChip, StatusChip } from "@/components/ui";
import { cn, formatINR, formatNumber, formatDate, greeting, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const quickActions = [
  { label: "Track Order", sub: "Delivery status", href: "/account/orders", icon: Package, tone: "bg-leaf-soft text-forest-700" },
  { label: "Browse Plants", sub: "Explore the collection", href: "/shop", icon: Leaf, tone: "bg-sky-soft text-sky-ink" },
  { label: "Manage Address", sub: "Delivery addresses", href: "/account/addresses", icon: MapPin, tone: "bg-violet-soft text-violet-ink" },
  { label: "Get Help", sub: "FAQs & support", href: "/contact", icon: HelpCircle, tone: "bg-amber-soft text-amber-ink" },
];

const accountMenu = [
  { href: "/account/profile/edit", icon: UserIcon, label: "Edit Profile", sub: "Update your personal details" },
  { href: "/account/orders", icon: Package, label: "My Orders", sub: "Track your orders" },
  { href: "/account/wishlist", icon: Heart, label: "Wishlist", sub: "Your saved items" },
  { href: "/account/addresses", icon: MapPin, label: "My Addresses", sub: "Manage delivery addresses" },
  { href: "/account/reviews", icon: Star, label: "My Reviews", sub: "Edit, update or delete your reviews" },
  { href: "/contact", icon: HelpCircle, label: "Help & Support", sub: "Get help, FAQs" },
  { href: "/about", icon: Info, label: "About Leaf & Pot", sub: "Who we are" },
];

/** Shared premium surface: soft border, layered shadow, large radius. */
const surface = premiumSurface;

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

  const phoneStats = [
    { label: "Orders", value: formatNumber(orders.length), icon: Package, tone: "bg-leaf-soft text-forest-700" },
    { label: "Saved plants", value: formatNumber(wishlist.length), icon: Heart, tone: "bg-danger-soft text-danger-ink" },
    { label: "Total spent", value: formatINR(totalSpent), icon: Wallet, tone: "bg-sky-soft text-sky-ink" },
  ];

  // The seeded dashboard promo points at /care-guide which has no route; land on the care section instead.
  const promoCtaHref =
    promo && (!promo.cta_url || promo.cta_url.startsWith("/care-guide")) ? "/about#care" : promo?.cta_url ?? "/about#care";

  return (
    <div className="space-y-4 sm:space-y-7">
      {/* Search (tablet & desktop) */}
      <form
        action="/shop"
        className="group hidden h-12 items-center gap-3 rounded-2xl border border-line/80 bg-white px-4 shadow-[0_1px_2px_rgba(18,56,42,0.04),0_16px_36px_-30px_rgba(18,56,42,0.55)] transition focus-within:border-forest-300 focus-within:ring-4 focus-within:ring-forest-100/70 sm:flex"
      >
        <Search className="h-4 w-4 shrink-0 text-forest-400" />
        <input
          type="search"
          name="q"
          placeholder="Search for plants, pots & more"
          aria-label="Search plants"
          className="h-full w-full bg-transparent text-[12.5px] font-medium text-forest-950 outline-none placeholder:text-muted/70"
        />
        <span className="hidden rounded-lg bg-forest-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-500 sm:block">
          Search
        </span>
      </form>

      {/* ───────────────────────────── Phone ───────────────────────────── */}
      <div className="space-y-3.5 sm:hidden">
        {/* Profile hero */}
        <PremiumHero
          eyebrow={
            <>
              <Leaf className="h-3 w-3" aria-hidden /> Your green space
            </>
          }
          avatar={
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[14px] font-bold tracking-tight text-forest-900">
              {initials(user.full_name)}
            </span>
          }
          title={<span className="block truncate">{user.full_name}</span>}
          description={
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" aria-hidden /> {user.email}
              </span>
              {user.phone && <span className="truncate text-white/45">{user.phone}</span>}
            </span>
          }
          compact
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-white/85 ring-1 ring-white/10">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              {user.role === "admin" ? "Admin" : "Verified customer"}
            </span>
            {settings.loyalty_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#d9b36a]/15 px-2.5 py-1 text-[10px] font-semibold text-[#f0d9a8] ring-1 ring-[#d9b36a]/20">
                <Sparkles className="h-3 w-3" aria-hidden />
                {formatNumber(user.loyalty_points)} points
              </span>
            )}
            {user.created_at && <span className="text-[10px] text-white/45">Since {formatDate(user.created_at)}</span>}
          </div>
        </PremiumHero>

        {/* Overview tiles */}
        <section className="grid grid-cols-3 gap-2.5">
          {phoneStats.map((stat) => (
            <StatTile
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
            />
          ))}
        </section>

        {/* Account menu */}
        <MobileMenuGroup rows={accountMenu.slice(0, 5)} />
        <MobileMenuGroup rows={accountMenu.slice(5)} />

        <MobileLogoutButton />
      </div>

      {/* ──────────────────────────── Desktop ──────────────────────────── */}
      <div className="hidden space-y-5 sm:block sm:space-y-7">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#0d2b1e] px-6 py-7 text-white ring-1 ring-white/10 shadow-[0_30px_70px_-40px_rgba(13,43,30,0.9)] sm:px-8 sm:py-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#2f7a56]/35 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#c8a45a]/10 blur-3xl"
          />
          <Leaf
            aria-hidden
            className="pointer-events-none absolute -right-6 -bottom-10 h-52 w-52 rotate-[22deg] text-white/[0.04]"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 ring-1 ring-white/10">
                <Leaf className="h-3 w-3" /> Your green space
              </span>
              <h1 className="mt-4 text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[32px]">
                {greeting()}, {user.full_name.split(" ")[0]} <span aria-hidden>👋</span>
              </h1>
              <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-white/60">
                {"Here's what's happening with your orders and plants."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
                {user.created_at && <span>Member since {formatDate(user.created_at)}</span>}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[10.5px] font-semibold text-white/80 ring-1 ring-white/10">
                  <ShieldCheck className="h-3 w-3" />
                  {user.role === "admin" ? "Admin" : "Verified customer"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <p className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[12px] italic text-white/70 backdrop-blur">
                A little green goes a long way
              </p>
              {settings.loyalty_enabled && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#d9b36a]/15 px-3 py-1 text-[11px] font-semibold text-[#f0d9a8] ring-1 ring-[#d9b36a]/20">
                  <Sparkles className="h-3.5 w-3.5" /> {formatNumber(user.loyalty_points)} reward points
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                surface,
                "group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(18,56,42,0.04),0_28px_56px_-32px_rgba(18,56,42,0.5)]",
              )}
            >
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-forest-300/60 to-transparent opacity-0 transition group-hover:opacity-100"
              />
              <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", stat.tone)}>
                <stat.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <CardLabel>{stat.label}</CardLabel>
              <p className="mt-1 text-[24px] font-semibold leading-none tracking-tight tabular-nums text-forest-950">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* Active order tracker */}
        {activeOrder && (
          <section className={cn(surface, "p-5 sm:p-6")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardLabel>Latest order</CardLabel>
                <h2 className="mt-1 font-mono text-[17px] font-semibold tracking-tight text-forest-950">
                  {activeOrder.order_number}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={activeOrder.status} />
                <PaymentStatusChip status={activeOrder.payment_status} />
              </div>
            </div>
            <div className="mt-5">
              <OrderProgress status={activeOrder.status} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
              <div className="flex items-center gap-2">
                {activeOrder.items.slice(0, 3).map((item) => (
                  <span key={item.id} className="relative h-11 w-10 overflow-hidden rounded-xl bg-leaf-mint ring-1 ring-line/60">
                    <SafeImage src={item.image} alt="" sizes="40px" />
                  </span>
                ))}
                <span className="ml-1 text-[11.5px] text-muted">
                  {activeOrder.items.length} item{activeOrder.items.length === 1 ? "" : "s"} · {formatINR(activeOrder.total)}
                </span>
              </div>
              <Link
                href={`/account/orders/${activeOrder.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-950 px-4 text-[11.5px] font-semibold text-white transition hover:bg-forest-800"
              >
                View order <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Recent orders */}
        <section className={cn(surface, "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-line/70 px-5 py-4 sm:px-6">
            <div>
              <CardLabel>Activity</CardLabel>
              <h2 className="mt-0.5 text-[16px] font-semibold tracking-tight text-forest-950">Recent Orders</h2>
            </div>
            {orders.length > 0 && (
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest-700 transition hover:text-forest-900"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-forest-50 text-forest-400">
                <Package className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-forest-950">No orders yet</p>
              <p className="mt-0.5 text-[11.5px] text-muted">Your plant orders will show up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line/60">
              {orders.slice(0, 5).map((order) => {
                const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-leaf-mint/40 sm:px-6"
                    >
                      <span className="relative h-10 w-9 shrink-0 overflow-hidden rounded-xl bg-leaf-mint ring-1 ring-line/60">
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
                        <span className="mt-0.5 block text-[10.5px] text-muted">
                          {formatDate(order.created_at, { day: "2-digit", month: "short" })} · {itemCount} item
                          {itemCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <StatusChip status={order.status} />
                      <span className="w-16 shrink-0 text-right text-[12.5px] font-semibold tabular-nums tracking-tight text-forest-950">
                        {formatINR(order.total)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-forest-300 transition group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Green rewards */}
        {settings.loyalty_enabled && (
          <Link
            href="/account/loyalty"
            className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d2b1e] via-[#123a29] to-[#1a5138] px-5 py-5 text-white shadow-[0_24px_60px_-38px_rgba(13,43,30,0.95)] ring-1 ring-white/10 sm:px-6"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full bg-[#d9b36a]/10 blur-3xl"
            />
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#d9b36a]/15 text-[#f0d9a8] ring-1 ring-[#d9b36a]/20">
              <Sparkles className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[15px] font-semibold tracking-tight text-white">Green Rewards</span>
              <span className="mt-0.5 block text-[11px] text-white/55">Earn points with every purchase!</span>
            </span>
            <span className="relative text-right">
              <span className="block text-[22px] font-semibold leading-none tracking-tight tabular-nums text-[#f0d9a8]">
                {formatNumber(user.loyalty_points)}
              </span>
              <span className="mt-1 block text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                {redeemValue > 0 ? `Worth ${formatINR(redeemValue)}` : "pts collected"}
              </span>
            </span>
            <ChevronRight className="relative h-4 w-4 shrink-0 text-white/50 transition group-hover:translate-x-0.5" />
          </Link>
        )}

        {/* Wishlist + quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <section className={cn(surface, "flex flex-col p-4 sm:p-5")}>
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold tracking-tight text-forest-950">Wishlist</h2>
              <Link
                href="/account/wishlist"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 transition hover:text-forest-900"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {wishlist.length === 0 ? (
              <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-2xl bg-[#f7faf7] px-3 py-6 text-center ring-1 ring-line/60">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-forest-300 shadow-sm">
                  <Heart className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <p className="mt-2.5 text-[11.5px] font-semibold text-forest-950">Nothing saved yet</p>
                <p className="text-[10.5px] text-muted">Tap the heart on a plant you love.</p>
                <Link
                  href="/shop"
                  className="mt-3 inline-flex h-8 items-center gap-1 rounded-xl bg-forest-950 px-3 text-[10.5px] font-semibold text-white transition hover:bg-forest-800"
                >
                  Find a plant <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ul className="mt-3 flex-1 space-y-2">
                {wishlist.slice(0, 3).map((product) => {
                  const price = product.variants.find((variant) => variant.is_active)?.price ?? 0;
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/product/${product.slug}`}
                        className="flex items-center gap-2.5 rounded-2xl bg-[#f7faf7] p-2 ring-1 ring-transparent transition hover:ring-line"
                      >
                        <span className="relative h-10 w-9 shrink-0 overflow-hidden rounded-xl bg-leaf-mint">
                          <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="34px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-semibold text-forest-950">
                            {product.name}
                          </span>
                          <span className="block text-[10px] tabular-nums text-muted">{formatINR(price)}</span>
                        </span>
                        <Heart className="h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.8} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={cn(surface, "flex flex-col p-4 sm:p-5")}>
            <h2 className="text-[14px] font-semibold tracking-tight text-forest-950">Quick Actions</h2>
            <ul className="mt-3 flex-1 space-y-2">
              {quickActions.map((action) => (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="flex h-full items-center gap-2.5 rounded-2xl bg-[#f7faf7] p-2 ring-1 ring-transparent transition hover:ring-line"
                  >
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", action.tone)}>
                      <action.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] font-semibold text-forest-950">
                        {action.label}
                      </span>
                      <span className="block truncate text-[10px] text-muted">{action.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Recommended plants */}
        <section>
          <div className="mb-3.5 flex items-end justify-between gap-3">
            <div>
              <CardLabel>Live from our botanical nursery</CardLabel>
              <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-forest-950">Recommended Live Plants</h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest-700 transition hover:text-forest-900"
            >
              Explore all ({livePlants.length}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {livePlants.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} wishlisted={wishlistIds.has(product.id)} loggedIn compact />
            ))}
          </div>
        </section>

        {/* Promo */}
        {promo && (
          <section className={cn(surface, "overflow-hidden")}>
            <div className="flex flex-col sm:flex-row sm:items-stretch">
              <div className="flex-1 p-5 sm:p-7">
                <CardLabel>{promo.eyebrow ?? "Special offer"}</CardLabel>
                <h2 className="mt-1.5 max-w-lg text-[21px] font-semibold leading-tight tracking-tight text-forest-950 sm:text-[24px]">
                  {promo.title}
                </h2>
                {promo.subtitle && (
                  <p className="mt-2 max-w-md text-[12px] leading-relaxed text-muted">{promo.subtitle}</p>
                )}
                <Link
                  href={promoCtaHref}
                  className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-forest-950 px-4 text-[11.5px] font-semibold text-white transition hover:bg-forest-800"
                >
                  {promo.cta_label ?? "Shop now"} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {promo.image_url && (
                <div className="relative min-h-[130px] w-full shrink-0 bg-leaf-mint sm:min-h-0 sm:w-[240px]">
                  <SafeImage src={promo.image_url} alt="" sizes="240px" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recently viewed + points activity */}
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
              <section className={cn(surface, "p-5 sm:p-6")}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold tracking-tight text-forest-950">Recently viewed</h2>
                  <Link href="/shop" className="text-[11px] font-semibold text-forest-700 transition hover:text-forest-900">
                    Shop all
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-line/60">
                  {recentlyViewed.map((product) => {
                    const price = product.variants.find((variant) => variant.is_active)?.price ?? 0;
                    return (
                      <li key={product.id}>
                        <Link
                          href={`/product/${product.slug}`}
                          className="group flex items-center gap-3 py-3 transition hover:opacity-90"
                        >
                          <span className="relative h-11 w-10 shrink-0 overflow-hidden rounded-xl bg-leaf-mint ring-1 ring-line/60">
                            <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="40px" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold text-forest-950">
                              {product.name}
                            </span>
                            <span className="block text-[10.5px] text-muted">{product.category_name}</span>
                          </span>
                          <span className="text-[12px] font-semibold tabular-nums text-forest-900">{formatINR(price)}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-forest-300 transition group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {settings.loyalty_enabled && latestTransactions.length > 0 && (
              <section className={cn(surface, "p-5 sm:p-6")}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold tracking-tight text-forest-950">Points activity</h2>
                  <Link
                    href="/account/loyalty"
                    className="text-[11px] font-semibold text-forest-700 transition hover:text-forest-900"
                  >
                    View all
                  </Link>
                </div>
                <ul className="mt-3 space-y-3">
                  {latestTransactions.map((transaction) => (
                    <li key={transaction.id} className="flex items-start justify-between gap-3 text-[11.5px]">
                      <span className="text-muted">{transaction.note ?? transaction.type}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-semibold tabular-nums",
                          transaction.points >= 0 ? "bg-success-soft text-success-ink" : "bg-danger-soft text-danger-ink",
                        )}
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

        {/* Care tip + shop by room */}
        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-forest-100 bg-gradient-to-br from-leaf-mint to-[#f3faf4] p-5 shadow-[0_1px_2px_rgba(18,56,42,0.04),0_20px_44px_-32px_rgba(18,56,42,0.4)] sm:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-white/50 blur-2xl"
            />
            <div className="relative flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-forest-700 shadow-sm">
                <Sprout className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-700">Plant care tip</p>
            </div>
            <p className="relative mt-3.5 text-[15px] font-semibold tracking-tight text-forest-950">
              Water less than you think.
            </p>
            <p className="relative mt-1 text-[11.5px] leading-relaxed text-forest-900/65">
              Most houseplants prefer slightly dry soil over soggy roots. Check the top two inches before watering.
            </p>
            <Link
              href="/about#care"
              className="relative mt-3.5 inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 transition hover:gap-1.5"
            >
              More care guides <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className={cn(surface, "p-5 sm:p-6")}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-tight text-forest-950">Shop by room</h2>
              <Link href="/shop" className="text-[11px] font-semibold text-forest-700 transition hover:text-forest-900">
                All collections
              </Link>
            </div>
            <ul className="mt-2.5">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={category.slug === "best-sellers" ? "/shop?sort=rating" : `/category/${category.slug}`}
                    className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-[#f7faf7]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-forest-300 transition group-hover:bg-forest-600" />
                    <span className="flex-1 truncate text-[11.5px] font-medium text-forest-900">{category.name}</span>
                    <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[9px] font-semibold tabular-nums text-muted transition group-hover:bg-leaf-mint group-hover:text-forest-700">
                      {category.product_count ?? 0}
                    </span>
                    <ChevronRight className="h-3 w-3 text-forest-300 opacity-0 transition group-hover:opacity-100" />
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
