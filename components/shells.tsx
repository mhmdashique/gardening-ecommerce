"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  Flower2,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  RotateCcw,
  Settings,
  Sparkles,
  Store,
  Ticket,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";
import { TabBar } from "@/components/mobile-tab-menu";
import { useToast } from "@/components/toast";
import { UserMenu } from "@/components/user-menu";
import { markAdminNotificationsReadAction, markNotificationsReadAction } from "@/lib/actions/account";
import { logoutAction } from "@/lib/actions/auth";
import { cn, initials, timeAgo } from "@/lib/utils";
import type { Category, Notification, User } from "@/lib/types";

/**
 * Shared logout control: shows a farewell toast as the server action signs
 * the user out and navigates home. `variant="admin"` renders the dark-sidebar
 * tile + label composition used in AdminShell.
 */
function LogoutSubmit({ className, variant = "icon" }: { className?: string; variant?: "icon" | "admin" }) {
  const { toast } = useToast();
  return (
    <form action={logoutAction} onSubmit={() => toast("You've been logged out. See you soon! 🌱", "success")}>
      <button
        type="submit"
        title={variant === "admin" ? undefined : "Log out"}
        aria-label={variant === "admin" ? undefined : "Log out"}
        className={className ?? "grid h-9 w-9 place-items-center rounded-xl text-rose-500 transition hover:bg-rose-50"}
      >
        {variant === "admin" ? (
          <>
            <span className="grid h-7 w-7 place-items-center rounded-lg text-rose-400/50">
              <LogOut className="h-[15px] w-[15px]" strokeWidth={1.9} />
            </span>
            Log out
          </>
        ) : (
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
        )}
      </button>
    </form>
  );
}


const storeLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/wishlist", label: "Wishlist", icon: Sparkles },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function StoreSidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="rounded-2xl border border-line bg-white p-2 shadow-sm" aria-label="Store navigation">
        {storeLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                active ? "bg-leaf-soft text-forest-950" : "text-muted hover:bg-leaf-mint hover:text-forest-900",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-forest-700" : "text-forest-500")} strokeWidth={1.8} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-3 rounded-2xl border border-forest-100 bg-leaf-mint p-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-forest-700 shadow-sm">
          <LifeBuoy className="h-4 w-4" />
        </span>
        <p className="mt-3 font-display text-[15px] font-semibold text-forest-950">Need a little help?</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">Our plant doctors are one message away.</p>
        <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest-800 hover:underline">
          Talk to us <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}

export function StoreChrome({
  user,
  wishlistCount,
  categories,
  freeShippingThreshold,
  children,
}: {
  user: User;
  wishlistCount: number;
  categories: Category[];
  freeShippingThreshold?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-leaf-cream">
      <SiteHeader
        user={user}
        wishlistCount={wishlistCount}
        categories={categories}
        freeShippingThreshold={freeShippingThreshold}
        onMenuClick={() => setOpen(true)}
      />
      <div className="container-shell flex gap-6 py-5 lg:py-7">
        <aside className="sticky top-[104px] hidden h-fit w-[208px] shrink-0 self-start lg:block">
          <StoreSidebar pathname={pathname} />
        </aside>
        <main id="main-content" className="min-w-0 flex-1 pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Store navigation">
          <button
            type="button"
            className="absolute inset-0 bg-forest-950/45 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-white p-4 shadow-lift animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <Brand size="sm" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-leaf-mint"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StoreSidebar pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-line pt-4">
              <UserMenu user={user} showName />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Customer dashboard                                                        */
/* -------------------------------------------------------------------------- */

const accountLinks = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

function NotificationBell({ notifications, unread }: { notifications: Notification[]; unread: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-forest-800 transition hover:bg-leaf-mint"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-[19px] w-[19px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber ring-2 ring-white" aria-hidden />
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
            tabIndex={-1}
          />
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift animate-fade-up">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-forest-950">Notifications</p>
              {unread > 0 && (
                <form action={markNotificationsReadAction}>
                  <button type="submit" className="text-[11px] font-semibold text-forest-700 hover:underline">
                    Mark all read
                  </button>
                </form>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted">You&apos;re all caught up.</li>
              )}
              {notifications.map((notification) => (
                <li key={notification.id} className={cn("border-b border-line/70 px-4 py-3", !notification.is_read && "bg-leaf-mint/50")}>
                  <div className="flex items-start gap-2.5">
                    <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", notification.is_read ? "bg-line" : "bg-forest-600")} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-forest-950">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{notification.body}</p>
                      <p className="mt-1 text-[10px] text-muted/80">{timeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/account/notifications" onClick={() => setOpen(false)} className="block bg-leaf-mint/60 px-4 py-2.5 text-center text-[11.5px] font-semibold text-forest-800 hover:bg-leaf-mint">
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function buildAccountBreadcrumbs(pathname: string) {
  if (pathname === "/account" || pathname === "/account/") {
    return [{ label: "Dashboard", href: "/account", isCurrent: true }];
  }

  const parts = pathname.replace(/^\/account\/?/, "").split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", href: "/account", isCurrent: false }];

  const nameMap: Record<string, string> = {
    orders: "Orders",
    wishlist: "Wishlist",
    profile: "Profile",
    addresses: "Addresses",
    loyalty: "Loyalty",
    notifications: "Notifications",
    settings: "Settings",
  };

  let acc = "/account";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    acc += `/${part}`;
    const isCurrent = i === parts.length - 1;
    let label = nameMap[part] || (part.length > 12 ? `${part.slice(0, 10)}…` : part);

    if (parts[0] === "orders" && i === 1) {
      label = `Order #${part.length > 8 ? `${part.slice(0, 8)}…` : part}`;
    }

    crumbs.push({ label, href: acc, isCurrent });
  }

  return crumbs;
}

export function AccountShell({
  user,
  notifications,
  unread,
  loyaltyEnabled,
  children,
}: {
  user: User;
  notifications: Notification[];
  unread: number;
  loyaltyEnabled: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const accountCrumbs = buildAccountBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-[#f6f9f5]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-white lg:flex">
        <div className="px-5 pb-4 pt-6">
          <Brand size="sm" withTagline={false} />
          <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.22em] text-muted/80">Customer dashboard</p>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4" aria-label="Dashboard navigation">
          {[
            { label: "Activity", links: accountLinks.slice(0, 2) },
            {
              label: "Manage",
              links: [
                ...(loyaltyEnabled ? [{ href: "/account/loyalty", label: "Loyalty", icon: Sparkles }] : []),
                ...accountLinks.slice(2, 4),
              ],
            },
          ].map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted/60">{group.label}</p>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                        active
                          ? "bg-forest-900 text-white shadow-sm"
                          : "text-forest-900/60 hover:bg-leaf-mint hover:text-forest-950",
                      )}
                    >
                      <Icon
                        className={cn("h-[17px] w-[17px] transition", active ? "text-white" : "text-forest-500")}
                        strokeWidth={1.8}
                      />
                      <span className="flex-1 truncate">{link.label}</span>
                      <span className={cn("h-1.5 w-1.5 rounded-full bg-amber", !active && "opacity-0")} aria-hidden />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mx-4 mb-3 rounded-2xl border border-forest-100 bg-leaf-mint/70 p-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-forest-600 shadow-sm">
            <Leaf className="h-4 w-4" />
          </span>
          <p className="mt-2.5 font-display text-[13.5px] font-semibold leading-snug text-forest-950">
            Every order plants a tree. Green choices for a better tomorrow.
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-forest-900/60">
            Thank you for growing with us — shop something leafy today.
          </p>
          <Link href="/shop" className="mt-2.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest-800 hover:text-forest-950">
            Shop new arrivals <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-center gap-2.5 border-t border-line px-4 py-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-900 text-[10px] font-bold text-white">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-forest-950">{user.full_name}</p>
            <p className="truncate text-[10px] text-muted">{user.email}</p>
          </div>
          <LogoutSubmit />
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Brand size="sm" />
              </div>
              <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-[11.5px] font-medium sm:flex">
                {accountCrumbs.map((crumb, idx) => (
                  <span key={crumb.href} className="inline-flex items-center gap-1.5">
                    {idx > 0 && <span className="text-forest-300 font-normal select-none">/</span>}
                    {crumb.isCurrent ? (
                      <span className="font-semibold text-forest-950" aria-current="page">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-muted transition hover:text-forest-800 hover:underline"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href="/"
                aria-label="Back to home"
                className="hidden sm:inline-flex sm:mr-0.5 h-9 items-center gap-2 rounded-full px-2.5 text-[11.5px] font-medium text-forest-700 transition hover:bg-leaf-mint hover:text-forest-950 sm:px-3"
              >
                <Home className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
                <span className="hidden sm:inline">Back to home</span>
              </Link>
              <NotificationBell notifications={notifications} unread={unread} />
              <div className="hidden sm:block">
                <UserMenu user={user} />
              </div>
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1280px] px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
          {children}
        </main>
        <footer className="hidden border-t border-line px-8 py-4 text-[11px] text-muted lg:block">
          © {new Date().getFullYear()} Leaf &amp; Pot · Green Home. Happy You.
        </footer>
      </div>

      <TabBar />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Admin                                                                     */
/* -------------------------------------------------------------------------- */

const adminNavGroups = [
  {
    label: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Catalogue",
    links: [
      { href: "/admin/products", label: "Products", icon: Boxes },
      { href: "/admin/categories", label: "Categories", icon: Flower2 },
    ],
  },
  {
    label: "Commerce",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    label: "Community",
    links: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
    ],
  },
  {
    label: "Marketing",
    links: [
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    ],
  },
  {
    label: "System",
    links: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/notifications": "Notifications",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/returns": "Returns & refunds",
  "/admin/customers": "Customers",
  "/admin/reviews": "Reviews",
  "/admin/coupons": "Coupons",
  "/admin/banners": "Banners",
  "/admin/settings": "Settings",
};

/** Shape passed from the admin layout for the command-center bell. */
export type AdminNotificationItem = Notification & { orderId?: string | null };

function AdminNotificationBell({
  notifications,
  unread,
}: {
  notifications: AdminNotificationItem[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-line text-forest-800 transition hover:bg-emerald-50 hover:border-emerald-300"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-[17px] w-[17px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber px-1 text-[9px] font-bold text-forest-950 ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
            tabIndex={-1}
          />
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift animate-fade-up">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-forest-950">Command Center notifications</p>
              {unread > 0 && (
                <form action={markAdminNotificationsReadAction}>
                  <button type="submit" className="text-[11px] font-semibold text-forest-700 hover:underline">
                    Mark all read
                  </button>
                </form>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted">You&apos;re all caught up.</li>
              )}
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-2.5 border-b border-line/70 px-4 py-3",
                    !notification.is_read && "bg-emerald-50/60",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                      notification.is_read ? "bg-line" : "bg-emerald-600",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] font-semibold text-forest-950">
                      {notification.type === "admin_order" && (
                        <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Order
                        </span>
                      )}
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                      {notification.body}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <p className="text-[10px] text-muted/80">{timeAgo(notification.created_at)}</p>
                      {notification.type === "admin_order" && (
                        <Link
                          href={notification.orderId ? `/admin/orders/${notification.orderId}` : "/admin/orders"}
                          onClick={() => setOpen(false)}
                          className="text-[10.5px] font-bold text-emerald-700 hover:underline"
                        >
                          View order →
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="block bg-emerald-50 px-4 py-2.5 text-center text-[11.5px] font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function buildAdminBreadcrumbs(pathname: string) {  if (pathname === "/admin" || pathname === "/admin/") {
    return [{ label: "dashboard", href: "/admin", isCurrent: true }];
  }

  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const crumbs = [{ label: "dashboard", href: "/admin", isCurrent: false }];

  let acc = "/admin";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    acc += `/${part}`;
    const isCurrent = i === parts.length - 1;

    let label = part.toLowerCase();
    if (parts[0] === "customers" && i === 1) {
      label = "customer _id";
    } else if (parts[0] === "orders" && i === 1) {
      label = "order _id";
    } else if (parts[0] === "products" && i === 1 && part !== "new") {
      label = "product _id";
    }

    crumbs.push({ label, href: acc, isCurrent });
  }

  return crumbs;
}

function getAdminSectionIcon(pathname: string) {
  if (pathname.startsWith("/admin/products")) return Boxes;
  if (pathname.startsWith("/admin/categories")) return Flower2;
  if (pathname.startsWith("/admin/orders")) return ClipboardList;
  if (pathname.startsWith("/admin/returns")) return RotateCcw;
  if (pathname.startsWith("/admin/customers")) return Users;
  if (pathname.startsWith("/admin/reviews")) return MessageSquare;
  if (pathname.startsWith("/admin/coupons")) return Ticket;
  if (pathname.startsWith("/admin/banners")) return ImageIcon;
  if (pathname.startsWith("/admin/settings")) return Settings;
  return LayoutDashboard;
}

function AdminSidebar({ pathname, user, onNavigate }: { pathname: string; user: User; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Leaf className="h-4.5 w-4.5 text-white" />
          </span>
          <div>
            <p className="font-display text-[17px] font-semibold leading-none tracking-tight text-white">
              Leaf <span className="text-emerald-400">&</span> Pot
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.07]" />

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4" aria-label="Admin navigation">
        {adminNavGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/30">
              {group.label}
            </p>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isExact = "exact" in link && Boolean((link as { exact?: boolean }).exact);
              const active = isExact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    active
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-white shadow-sm ring-1 ring-white/10"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <span className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-all",
                    active ? "bg-emerald-500/20 text-emerald-300" : "text-white/40",
                  )}>
                    <Icon className="h-[15px] w-[15px]" strokeWidth={1.9} />
                  </span>
                  {link.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.07]" />

      {/* Bottom: storefront + logout */}
      <div className="p-3 space-y-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-medium text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg text-white/40">
            <Store className="h-[15px] w-[15px]" strokeWidth={1.9} />
          </span>
          View storefront
        </Link>
        <LogoutSubmit variant="admin" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-medium text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-300 transition-all" />
      </div>

      {/* User profile strip */}
      <div className="m-3 flex items-center gap-2.5 rounded-2xl bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/[0.07]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white uppercase">
          {user.full_name?.[0] ?? user.email?.[0] ?? "A"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-white">{user.full_name ?? "Admin"}</p>
          <p className="truncate text-[10px] text-white/40">{user.email}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-emerald-300">
          Admin
        </span>
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  notifications = [],
  unread = 0,
  children,
}: {
  user: User;
  notifications?: AdminNotificationItem[];
  unread?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const crumbs = buildAdminBreadcrumbs(pathname);
  const SectionIcon = getAdminSectionIcon(pathname);

  const title =
    pathname === "/admin" || pathname === "/admin/"
      ? "Dashboard"
      : pathname.startsWith("/admin/customers")
        ? "Customers"
        : pathname === "/admin/products/new"
          ? "New Product"
          : pathname.startsWith("/admin/products/") && pathname !== "/admin/products"
            ? "Edit Product"
            : pathname.startsWith("/admin/products")
              ? "Products"
              : pathname.startsWith("/admin/orders/") && pathname !== "/admin/orders"
                ? "Order Details"
                : pathname.startsWith("/admin/orders")
                  ? "Orders"
                  : pathname.startsWith("/admin/categories")
                    ? "Categories"
                    : pathname.startsWith("/admin/returns")
                      ? "Returns & refunds"
                      : pathname.startsWith("/admin/reviews")
                        ? "Reviews"
                        : pathname.startsWith("/admin/coupons")
                          ? "Coupons"
                          : pathname.startsWith("/admin/banners")
                            ? "Banners"
                            : pathname.startsWith("/admin/settings")
                              ? "Settings"
                              : (pageTitles[pathname] ?? "Admin");

  return (
    <div className="min-h-screen bg-[#f2f6f2]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-[#0e1f17] shadow-[4px_0_24px_rgba(0,0,0,0.18)] lg:flex">
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-emerald-950/30" />
        <div className="relative flex flex-col h-full">
          <AdminSidebar pathname={pathname} user={user} />
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top header */}
        <header className="sticky top-0 z-40 border-b border-[#e0eae0]/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[60px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left: hamburger + brand badge */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-full text-forest-900 hover:bg-forest-100 transition lg:hidden"
                aria-label="Open admin menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-display text-[15px] font-bold tracking-tight text-forest-950">
                  Leaf &amp; Pot
                </span>
                <span className="text-forest-300 text-xs select-none">/</span>
                <span className="text-xs font-semibold text-emerald-800">
                  Command Center
                </span>
              </div>
            </div>

            {/* Right: notifications + storefront link + status pill + user */}
            <div className="flex shrink-0 items-center gap-2.5">
              <AdminNotificationBell notifications={notifications} unread={unread} />
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-[11px] font-semibold text-forest-800 transition hover:bg-emerald-50 hover:border-emerald-300 sm:inline-flex"
              >
                Storefront ↗
              </Link>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Store live
              </span>
              <div className="h-6 w-px bg-line hidden sm:block" />
              <UserMenu user={user} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {/* Breadcrumb Model (Box 1: Title, Box 2: Lowercase Breadcrumb Path) */}
          <div className="mb-6 space-y-2.5">
            {/* Box 1: Customers / Section Title */}
            <div className="rounded-2xl border border-line bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:border-emerald-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <SectionIcon className="h-4.5 w-4.5" />
                  </span>
                  <h1 className="font-display text-xl font-bold tracking-tight text-forest-950 sm:text-2xl">
                    {title}
                  </h1>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Leaf &amp; Pot
                </span>
              </div>
            </div>

            {/* Box 2: dashboard / customers / customer _id */}
            <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/40 px-5 py-3 shadow-xs">
              <nav aria-label="Breadcrumb" className="flex items-center flex-wrap text-[13px] font-medium text-forest-800">
                {crumbs.map((crumb, idx) => (
                  <span key={crumb.href} className="inline-flex items-center">
                    {idx > 0 && (
                      <span className="mx-2 text-emerald-600/60 select-none font-semibold">/</span>
                    )}
                    {crumb.isCurrent ? (
                      <span className="font-bold text-emerald-950 bg-emerald-100/70 px-2 py-0.5 rounded-md" aria-current="page">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-forest-700/80 hover:text-emerald-800 hover:underline transition"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>
          </div>

          {children}
        </main>

        {/* Footer */}
        <footer className="hidden border-t border-line/60 px-8 py-4 text-[11px] text-muted/70 lg:flex items-center justify-between">
          <span>© {new Date().getFullYear()} Leaf & Pot · Admin Console</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
        </footer>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            className="absolute inset-0 bg-forest-950/60 backdrop-blur-[3px] animate-fade-in"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-[#0e1f17] shadow-2xl animate-fade-up">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-emerald-950/30" />
            <div className="relative flex flex-col h-full">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 transition"
                aria-label="Close menu"
              >
                <X className="h-4.5 w-4.5" />
              </button>
              <AdminSidebar pathname={pathname} user={user} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
