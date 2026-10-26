"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  LogIn,
  Settings as SettingsIcon,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";
import { CartCount } from "@/components/cart-ui";
import { useCart } from "@/components/cart-provider";

/**
 * Floating mobile tab dock (storefront + account, below `lg`):
 * Profile · Shop · Home · Cart · Settings.
 *
 * The active tab is a raised dark circle with its label underneath; inactive
 * tabs are icon-only, matching the reference dock. Guests get Login in the
 * account slot.
 */

const tabs = [
  { href: "/account", label: "Profile", icon: UserIcon },
  { href: "/shop", label: "Shop", icon: LayoutGrid },
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/account/settings", label: "Settings", icon: SettingsIcon },
];

export function TabBar() {
  const pathname = usePathname();
  const { loggedIn } = useCart();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-[65] lg:hidden" aria-label="Mobile tab menu">
      <div className="mx-auto flex h-[calc(64px+env(safe-area-inset-bottom))] max-w-md items-center justify-around rounded-[26px] bg-[#f2f3f1]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_16px_40px_rgba(12,32,21,0.18)] ring-1 ring-black/[0.04] backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.exact
            ? pathname === tab.href
            : tab.href === "/account"
              ? pathname.startsWith("/account") && !pathname.startsWith("/account/settings")
              : pathname.startsWith(tab.href);

          // Guests: drop the Account tab and offer a Login button instead.
          if (!loggedIn && tab.href === "/account") {
            return (
              <Link
                key="login"
                href="/login"
                aria-label="Log in"
                className="flex h-full w-1/5 items-center justify-center rounded-2xl text-forest-900/70 transition hover:bg-black/[0.04] hover:text-forest-950"
              >
                <LogIn className="h-[22px] w-[22px]" strokeWidth={1.6} />
              </Link>
            );
          }

          if (!active) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="relative flex h-full w-1/5 items-center justify-center rounded-2xl text-forest-900/70 transition hover:bg-black/[0.04] hover:text-forest-950"
              >
                <span className="relative grid place-items-center">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                  {tab.href === "/cart" && <CartCount className="-right-2 -top-2" />}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current="page"
              className="relative flex h-full w-1/5 flex-col items-center justify-end pb-1.5"
            >
              <span className="absolute -top-7 grid h-14 w-14 place-items-center rounded-full bg-forest-950 text-white shadow-[0_10px_24px_rgba(10,25,17,0.28)] ring-[6px] ring-[#f8f9f7]">
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                {tab.href === "/cart" && <CartCount className="-right-0.5 -top-0.5" />}
              </span>
              <span className="text-[11px] font-semibold leading-none text-forest-950">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
