"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Heart,
  Home,
  Leaf,
  Menu,
  Search,
  ShoppingCart,
  User as UserIcon,
  X,
} from "lucide-react";
import { CartCount } from "@/components/cart-ui";
import { useCart } from "@/components/cart-provider";
import { SearchDialog } from "@/components/search-dialog";
import { buttonClasses } from "@/components/ui";
import { UserMenu } from "@/components/user-menu";
import { logoutAction } from "@/lib/actions/auth";
import { cn, formatINR } from "@/lib/utils";
import type { Category, User } from "@/lib/types";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const signedInLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/settings", label: "Settings" },
];

function IconButton({
  label,
  onClick,
  href,
  children,
  badge,
  className,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  badge?: number;
  className?: string;
}) {
  const content = (
    <span className={cn("relative grid h-8 w-8 place-items-center rounded-full text-forest-700 transition-all duration-200 hover:bg-forest-100/70 hover:text-forest-950", className)}>
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-h-[14px] min-w-[14px] place-items-center rounded-full bg-forest-700 px-1 text-[8px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </span>
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}>
      {content}
    </button>
  );
}

export function SiteHeader({
  user,
  wishlistCount = 0,
  categories = [],
  freeShippingThreshold,
  onMenuClick,
}: {
  user: User | null;
  wishlistCount?: number;
  categories?: Category[];
  freeShippingThreshold?: number;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const { count } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const signedIn = Boolean(user);
  const links = signedIn ? signedInLinks : publicLinks;

  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop navbar — morphs from full-width to pill on scroll */}
      <header className="sticky top-0 z-50 w-full pointer-events-none">
        <div
          className={cn(
            "hidden lg:flex pointer-events-auto transition-all duration-500 ease-in-out",
            scrolled
              ? "justify-center pt-3 px-6"
              : "justify-stretch px-0",
          )}
        >
          <nav
            className={cn(
              "flex items-center transition-all duration-500 ease-in-out",
              scrolled
                ? "gap-1 rounded-full px-3 py-2 bg-white/95 shadow-[0_8px_32px_rgba(31,77,58,0.18)] backdrop-blur-xl border border-forest-100"
                : "w-full rounded-none px-6 py-0 h-[68px] bg-white border-b border-line shadow-sm",
            )}
            aria-label="Main navigation"
          >
            {/* ── LEFT: Logo ── */}
            <Link
              href="/"
              aria-label="Leaf & Pot home"
              className={cn(
                "flex shrink-0 items-center gap-2 transition-all hover:opacity-80",
                scrolled ? "rounded-full px-2 py-1.5 hover:bg-forest-50" : "",
              )}
            >
              <span className={cn(
                "grid place-items-center rounded-full bg-forest-800 transition-all duration-500",
                scrolled ? "h-7 w-7" : "h-8 w-8",
              )}>
                <Leaf className={cn("text-white transition-all duration-500", scrolled ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </span>
              <span className={cn(
                "display-title font-semibold tracking-tight text-forest-950 transition-all duration-500",
                scrolled ? "text-[15px]" : "text-[18px]",
              )}>
                Leaf <span className="text-forest-500">&</span> Pot
              </span>
            </Link>

            {/* Separator (pill only) */}
            {scrolled && <span className="h-5 w-px bg-forest-100 mx-2 shrink-0" />}

            {/* ── CENTER: Nav links ── */}
            <div className={cn(
              "flex items-center gap-0.5 transition-all duration-500",
              scrolled ? "" : "flex-1 justify-center",
            )}>
              {publicLinks.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "font-medium text-[13px] transition-all duration-200",
                      scrolled
                        ? cn(
                            "rounded-full px-3.5 py-1.5",
                            active
                              ? "bg-forest-900 text-white shadow-sm"
                              : "text-forest-700 hover:bg-forest-100/70 hover:text-forest-950",
                          )
                        : cn(
                            "rounded-lg px-3.5 py-2",
                            active
                              ? "text-forest-950 font-semibold"
                              : "text-forest-600 hover:bg-forest-50 hover:text-forest-900",
                          ),
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Separator (pill only) */}
            {scrolled && <span className="h-5 w-px bg-forest-100 mx-2 shrink-0" />}

            {/* ── RIGHT: Icon buttons ── */}
            <div className={cn(
              "flex shrink-0 items-center gap-0.5",
              !scrolled && "",
            )}>
              {/* Home icon button */}
              <IconButton label="Home" href="/">
                <Home className="h-[17px] w-[17px]" />
              </IconButton>

              {/* Search icon button */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="grid h-9 w-9 place-items-center rounded-full text-forest-700 transition-all hover:bg-forest-100/70 hover:text-forest-950"
              >
                <Search className="h-[17px] w-[17px]" />
              </button>

              {/* Wishlist */}
              <IconButton label="Wishlist" href="/wishlist" badge={wishlistCount}>
                <Heart className="h-[17px] w-[17px]" />
              </IconButton>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative grid h-9 w-9 place-items-center rounded-full text-forest-700 transition-all hover:bg-forest-100/70 hover:text-forest-950"
                aria-label={`Shopping bag — ${count} item${count !== 1 ? "s" : ""}`}
              >
                <ShoppingCart className="h-[17px] w-[17px]" />
                <CartCount />
              </Link>

              {/* Auth */}
              {user ? (
                <div className="ml-1">
                  <UserMenu user={user} />
                </div>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    "ml-1.5 flex items-center gap-1.5 font-semibold text-white bg-forest-900 transition-all hover:bg-forest-800",
                    scrolled
                      ? "h-8 rounded-full px-4 text-[12.5px]"
                      : "h-9 rounded-full px-5 text-[13px] shadow-sm",
                  )}
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </nav>
        </div>


        {/* Mobile header */}
        <div className="pointer-events-auto lg:hidden border-b border-line/70 bg-white/95 backdrop-blur">
          <div className="container-shell flex h-[58px] items-center gap-2">
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => (onMenuClick ? onMenuClick() : setMobileMenu(true))}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-forest-800 hover:bg-forest-100/60 transition-all"
              aria-label="Open menu"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>

            {/* Centered logo */}
            <div className="flex flex-1 justify-center">
              <Link
                href="/"
                aria-label="Leaf & Pot home"
                className="flex items-center gap-2"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-forest-800">
                  <Leaf className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="display-title text-[16px] font-semibold tracking-tight text-forest-950">
                  Leaf <span className="text-forest-500">&</span> Pot
                </span>
              </Link>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1">
              <IconButton label="Home" href="/">
                <Home className="h-[17px] w-[17px]" />
              </IconButton>
              <IconButton label="Search" onClick={() => setSearchOpen(true)}>
                <Search className="h-[17px] w-[17px]" />
              </IconButton>
              <Link
                href="/cart"
                className="relative grid h-8 w-8 place-items-center rounded-full text-forest-700 transition-all hover:bg-forest-100/70"
                aria-label={`Cart — ${count} items`}
              >
                <ShoppingCart className="h-[17px] w-[17px]" />
                <CartCount />
              </Link>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="container-shell pb-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-full items-center gap-2.5 rounded-full border border-forest-100 bg-forest-50/70 px-3.5 text-left text-[12px] text-muted transition-all hover:border-forest-300"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-forest-500" />
              Search plants, pots, or categories…
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile drawer */}
      {!onMenuClick && mobileMenu && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-forest-950/50 backdrop-blur-[3px] animate-fade-in"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-white shadow-2xl animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenu(false)}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-800">
                  <Leaf className="h-4 w-4 text-white" />
                </span>
                <span className="display-title text-[17px] font-semibold tracking-tight text-forest-950">
                  Leaf <span className="text-forest-500">&</span> Pot
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenu(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-forest-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile navigation">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Navigate
              </p>
              {links.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all",
                      active
                        ? "bg-forest-900 text-white"
                        : "text-forest-800 hover:bg-forest-50",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {categories.length > 0 && (
                <>
                  <div className="my-3 h-px bg-line" />
                  <p className="px-3.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Shop by category
                  </p>
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] text-forest-700 transition-all hover:bg-forest-50 hover:text-forest-950"
                    >
                      {category.name}
                      <span className="text-[10px] text-muted">{category.product_count ?? 0}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Footer */}
            <div className="border-t border-line p-4 space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 rounded-xl bg-forest-50 px-3 py-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-800 text-white text-xs font-bold">
                      {user.full_name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-forest-950">{user.full_name}</p>
                      <p className="truncate text-[11px] text-muted">{user.email}</p>
                    </div>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="ml-auto shrink-0 rounded bg-amber px-2 py-0.5 text-[9px] font-bold uppercase text-forest-900"
                      >
                        Admin
                      </Link>
                    )}
                  </div>
                  <Link href="/account" className={buttonClasses({ size: "sm", className: "w-full" })}>
                    <UserIcon className="h-4 w-4" /> My Account
                  </Link>
                  <form action={logoutAction} className="text-center">
                    <button type="submit" className="text-[11.5px] font-semibold text-danger hover:underline">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className={buttonClasses({ className: "w-full" })}>
                  <UserIcon className="h-4 w-4" /> Login / Sign Up
                </Link>
              )}
              <p className="text-center text-[10px] text-muted">
                {typeof freeShippingThreshold === "number"
                  ? `Free shipping over ${formatINR(freeShippingThreshold)} · Plant care support`
                  : "Free shipping on eligible orders · Plant care support"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
