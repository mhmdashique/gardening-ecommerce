import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { premiumSurface } from "@/components/premium";
import { MobileLogoutButton } from "@/components/mobile-logout-button";
export { MobileLogoutButton };

/**
 * Mobile-only menu primitives styled after the premium account design:
 * grouped white cards with soft icon tiles, label rows and chevrons.
 * Everything here is hidden at `sm:` and up so desktop/tablet layouts
 * keep their existing composition untouched.
 */

export interface MobileMenuRow {
  icon: LucideIcon;
  label: string;
  /** Optional one-line description under the label. */
  sub?: string;
  /** Trailing static value (e.g. "English") renders instead of a chevron. */
  value?: string;
  /** Destination; omit for informational rows. */
  href?: string;
  /** Tailwind classes for the icon tile. */
  tone?: string;
}

export function MobileMenuGroup({ label, rows }: { label?: string; rows: MobileMenuRow[] }) {
  return (
    <div className="sm:hidden">
      {label && (
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {label}
        </p>
      )}
      <div className={cn(premiumSurface, "overflow-hidden")}>
        <div className="divide-y divide-line/60">
          {rows.map((row) => {
            const inner = (
              <>
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 ring-1 ring-forest-100/70",
                    row.tone,
                  )}
                >
                  <row.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold tracking-tight text-forest-950">
                    {row.label}
                  </span>
                  {row.sub && <span className="mt-0.5 block text-[11px] text-muted">{row.sub}</span>}
                </span>
                {row.value ? (
                  <span className="shrink-0 text-[12px] font-semibold text-forest-900">{row.value}</span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-forest-300" />
                )}
              </>
            );
            return row.href ? (
              <Link
                key={row.label}
                href={row.href}
                className="group flex w-full items-center gap-3 px-4 py-3.5 transition active:bg-leaf-mint/50"
              >
                {inner}
              </Link>
            ) : (
              <div key={row.label} className="group flex w-full items-center gap-3 px-4 py-3.5">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
