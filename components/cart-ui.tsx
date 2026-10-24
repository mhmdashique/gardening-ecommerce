"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { cn, formatINR } from "@/lib/utils";

export function MobileCartBar() {
  const { count, totals } = useCart();
  const pathname = usePathname();
  if (count === 0) return null;
  if (pathname.startsWith("/checkout") || pathname === "/cart") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-forest-800/10 bg-forest-900 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-white shadow-lift lg:hidden">
      <div className="flex items-center gap-3">
        <Link href="/cart" className="flex flex-1 flex-col text-left" aria-label="View cart">
          <span className="text-[10.5px] uppercase tracking-wider text-white/65">
            {count} {count === 1 ? "Plant" : "Plants"}
          </span>
          <span className="text-sm font-semibold">{formatINR(totals.total)}</span>
        </Link>
        <Link
          href="/cart"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-forest-900 shadow-sm"
        >
          View Cart
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function CartCount({ className }: { className?: string }) {
  const { count } = useCart();
  if (!count) return null;
  return (
    <span
      className={cn(
        "absolute -right-1.5 -top-1.5 grid min-h-[17px] min-w-[17px] place-items-center rounded-full bg-amber px-1 text-[10px] font-bold text-forest-950",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
