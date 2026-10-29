import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Wallet,
  User,
  Clock,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getOrdersForUser,
  getSettings,
  getWishlistProducts,
} from "@/lib/catalog";
import { DeleteAccountForm } from "@/components/account-forms";
import { MobileLogoutButton } from "@/components/mobile-menu";
import { LogoutButton } from "@/components/mobile-logout-button";
import { Badge } from "@/components/ui";
import { cn, formatINR, formatNumber, formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">{title}</h2>
      </div>
      <ul className="divide-y divide-line">{children}</ul>
    </section>
  );
}

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");
  const [orders, wishlist, settings] = await Promise.all([
    getOrdersForUser(user.id),
    getWishlistProducts(user.id),
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
    <div className="space-y-5">
      {/* Profile header */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-leaf-mint/80 via-white to-white p-5 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-forest-900 font-display text-xl font-semibold text-white shadow-soft sm:h-20 sm:w-20 sm:text-2xl">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[22px] font-semibold leading-tight text-forest-950 sm:text-[28px]">
              {user.full_name}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
              </span>
              {user.phone && <span className="mx-0.5">•</span>}
              {user.phone && <span>{user.phone}</span>}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge tone="green">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                {user.role === "admin" ? "Admin" : "Verified customer"}
              </Badge>
              {settings.loyalty_enabled && (
                <Badge tone="amber">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  {formatNumber(user.loyalty_points)} points
                </Badge>
              )}
              {user.created_at && (
                <span className="text-[11px] text-muted">Member since {formatDate(user.created_at)}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Account overview */}
      <section className="grid gap-3 sm:gap-4 grid-cols-3">
        {overview.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card">
            <span className={`grid h-9 w-9 place-items-center rounded-xl sm:h-11 sm:w-11 ${stat.tone}`}>
              <stat.icon className="h-4.5 w-4.5 sm:h-[20px] sm:w-[20px]" strokeWidth={1.8} />
            </span>
            <p className="mt-3 truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-muted sm:mt-4 sm:text-[10px]">
              {stat.label}
            </p>
            <p className="mt-0.5 truncate font-display text-[16px] font-semibold tabular-nums tracking-tight text-forest-950 sm:mt-1 sm:text-[22px]">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Responsive section grid: 1 col mobile, 2 cols desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Account">
          <Link
            href="/account/profile/edit"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">Personal details</span>
                <span className="block text-[10.5px] text-muted">Name, email and phone</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
          <Link
            href="/account/profile/password/change"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">Password & security</span>
                <span className="block text-[10.5px] text-muted">Update your password</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
        </ProfileSection>

        <ProfileSection title="Orders & addresses">
          <Link
            href="/account/orders"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">My orders</span>
                <span className="block text-[10.5px] text-muted">Track your orders</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
          <Link
            href="/account/addresses"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">My addresses</span>
                <span className="block text-[10.5px] text-muted">Delivery & billing addresses</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
        </ProfileSection>

        <ProfileSection title="Wishlist & support">
          <Link
            href="/account/wishlist"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">My wishlist</span>
                <span className="block text-[10.5px] text-muted">Saved plants</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">Help & support</span>
                <span className="block text-[10.5px] text-muted">FAQs and contact us</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
        </ProfileSection>

        <ProfileSection title="About & policies">
          <Link
            href="/about"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">About Leaf & Pot</span>
                <span className="block text-[10.5px] text-muted">Version 1.0.0</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
          <Link
            href="/policies/privacy"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">Privacy Policy</span>
                <span className="block text-[10.5px] text-muted">How we protect your data</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
          <Link
            href="/policies/terms"
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-forest-600" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-forest-950">Terms & Conditions</span>
                <span className="block text-[10.5px] text-muted">Our terms of service</span>
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
          </Link>
        </ProfileSection>
      </div>

      {/* Danger zone */}
      <section className={cn("card p-4 sm:p-5", "flex flex-wrap items-center justify-between gap-3 border-danger/25 overflow-hidden")}>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-forest-950">Delete Account</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Permanently remove your account, orders, addresses, wishlist and reviews.
          </p>
        </div>
        <DeleteAccountForm />
      </section>

      {/* Log out */}
      <section className="card p-4 sm:p-5 pb-2">
        <div className="hidden sm:block max-w-[220px]">
          <LogoutButton variant="soft" />
        </div>
        <MobileLogoutButton variant="soft" />
      </section>
    </div>
  );
}
