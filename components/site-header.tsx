"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Heart,
  Home,
  Leaf,
  Mail,
  Search,
  ShoppingCart,
  Sprout,
  Store,
} from "lucide-react";
import { CartCount } from "@/components/cart-ui";
import { useCart } from "@/components/cart-provider";
import { SearchDialog } from "@/components/search-dialog";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";
import type { Category, User } from "@/lib/types";

const publicLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/about", label: "About", icon: Sprout },
  { href: "/contact", label: "Contact", icon: Mail },
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
  const [scrolled, setScrolled] = useState(false);

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
              aria-label="Leaf & Pot"
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
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-2 font-medium text-[13px] transition-all duration-200",
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
                    <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} aria-hidden />
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
        <div className="pointer-events-auto border-b border-line/70 bg-white/95 backdrop-blur lg:hidden">
          <div className="container-shell relative flex h-[58px] items-center justify-end gap-2">
            {/* Centered logo */}
            <Link
              href="/"
              aria-label="Leaf & Pot"
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-forest-800">
                <Leaf className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="display-title text-[16px] font-semibold tracking-tight text-forest-950">
                Leaf <span className="text-forest-500">&</span> Pot
              </span>
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-1">
              <IconButton label="Search" onClick={() => setSearchOpen(true)}>
                <Search className="h-[17px] w-[17px]" />
              </IconButton>
              {user ? (
                <UserMenu user={user} showName={false} />
              ) : (
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-forest-800 transition hover:bg-forest-100/70 hover:text-forest-950"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

    </>
  );
}
