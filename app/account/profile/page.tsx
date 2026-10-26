import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Heart,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Package,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getAddresses,
  getOrdersForUser,
  getSettings,
  getWishlistProducts,
} from "@/lib/catalog";
import {
  AddressBook,
  DeleteAccountForm,
  PasswordForm,
  ProfileForm,
} from "@/components/account-forms";
import { MobileLogoutButton, MobileMenuGroup } from "@/components/mobile-menu";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui";
import { formatINR, formatNumber, formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");
  const [orders, wishlist, addresses, settings] = await Promise.all([
    getOrdersForUser(user.id),
    getWishlistProducts(user.id),
    getAddresses(user.id),
    getSettings(),
  ]);

  const totalSpent = orders
    .filter((order) => !["cancelled", "returned"].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);

  const overview = [
    { label: "Orders placed", value: formatNumber(orders.length), icon: Package, tone: "bg-leaf-soft text-forest-700" },
    { label: "Saved plants", value: formatNumber(wishlist.length), icon: Heart, tone: "bg-danger-soft text-danger-ink" },
    { label: "Total spent", value: formatINR(totalSpent), icon: Wallet, tone: "bg-sky-soft text-sky-ink" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Profile header */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-leaf-mint/80 via-white to-white p-4 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest-900 font-display text-lg font-semibold text-white shadow-soft sm:h-16 sm:w-16 sm:text-xl">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[20px] font-semibold leading-tight text-forest-950 sm:text-[24px]">
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

      {/* Account overview */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {overview.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4">
            <span className={`grid h-8 w-8 place-items-center rounded-full sm:h-10 sm:w-10 ${stat.tone}`}>
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

      {/* Phone account menu (mobile reference design) */}
      <div className="space-y-3 sm:hidden">
        <MobileMenuGroup
          rows={[
            { href: "/account/orders", icon: Package, label: "My Orders", sub: "Track your orders" },
            { href: "/account/wishlist", icon: Heart, label: "Wishlist", sub: "Your saved items" },
            { href: "/account/addresses", icon: MapPin, label: "My Addresses", sub: "Manage delivery addresses" },
            { href: "/contact", icon: HelpCircle, label: "Help & Support", sub: "Get help, FAQs" },
            { href: "/about", icon: Info, label: "About Leaf & Pot", sub: "Who we are" },
          ]}
        />
        <MobileLogoutButton />
      </div>

      {/* Forms & side cards (tablet & desktop) — phones get the dedicated sub-pages instead */}
      <div className="hidden gap-4 sm:grid sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 sm:space-y-5">
          {/* Personal details */}
          <section id="details" className="card scroll-mt-24 p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-forest-950">Personal details</h2>
            <p className="mt-1 text-[11.5px] text-muted">Keep your contact details current so deliveries arrive smoothly.</p>
            <div className="mt-4">
              <ProfileForm fullName={user.full_name} phone={user.phone} />
            </div>
            <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted">
              Your email is used to sign in and cannot be changed here. Contact support if you need to update it.
            </p>
          </section>

          {/* Password & security */}
          <section id="password" className="card scroll-mt-24 p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-forest-700">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-forest-950">Password & security</h2>
                <p className="mt-0.5 text-[11.5px] text-muted">Use at least 8 characters with one letter and one number.</p>
              </div>
            </div>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </section>

          {/* Saved addresses */}
          <section id="addresses" className="card scroll-mt-24 p-4 sm:p-5">
            <AddressBook addresses={addresses} />
          </section>
        </div>

        <aside className="space-y-4 sm:space-y-5">
          {/* Wishlist preview */}
          <section id="wishlist" className="card scroll-mt-24 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-semibold text-forest-950">My wishlist</h2>
              <Link href="/account/wishlist" className="text-[10.5px] font-semibold text-forest-700 hover:underline">
                View all
              </Link>
            </div>
            {wishlist.length === 0 ? (
              <div className="mt-3 rounded-xl bg-forest-50/70 px-3 py-5 text-center">
                <Heart className="mx-auto h-5 w-5 text-forest-300" />
                <p className="mt-1.5 text-[11.5px] font-semibold text-forest-950">Nothing saved yet</p>
                <Link href="/shop" className="mt-2 inline-block text-[10.5px] font-semibold text-forest-700 hover:underline">
                  Browse the collection
                </Link>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {wishlist.slice(0, 3).map((product) => {
                  const price = product.variants.find((variant) => variant.is_active)?.price ?? 0;
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/product/${product.slug}`}
                        className="flex items-center gap-2.5 rounded-xl bg-forest-50/70 p-2 transition hover:bg-leaf-mint"
                      >
                        <span className="relative h-10 w-9 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                          <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="36px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-semibold text-forest-950">
                            {product.name}
                          </span>
                          <span className="block text-[10px] text-muted">{formatINR(price)}</span>
                        </span>
                        <Heart className="h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.8} />
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link
                    href="/account/wishlist"
                    className="flex items-center justify-between rounded-xl border border-dashed border-line px-3 py-2 text-[10.5px] font-semibold text-forest-700 transition hover:border-forest-300 hover:bg-leaf-mint/60"
                  >
                    Open full wishlist ({wishlist.length}) <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            )}
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-danger/25 bg-white p-4 shadow-card sm:p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-danger-ink">
              <ShieldAlert className="h-3.5 w-3.5" /> Danger zone
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Deleting your account permanently removes your orders, addresses, wishlist, reviews and reward points.
              This cannot be undone once confirmed.
            </p>
            <div className="mt-3">
              <DeleteAccountForm />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
