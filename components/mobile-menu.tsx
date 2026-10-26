import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileLogoutButton } from "@/components/mobile-logout-button";
export { MobileLogoutButton };

/**
 * Mobile-only menu primitives styled after the mobile reference design:
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
      {label && <p className="mb-1.5 px-1 text-[12.5px] font-semibold text-forest-950">{label}</p>}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="divide-y divide-line">
          {rows.map((row) => {
            const inner = (
              <>
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700",
                    row.tone,
                  )}
                >
                  <row.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-forest-950">{row.label}</span>
                  {row.sub && <span className="mt-0.5 block text-[10.5px] text-muted">{row.sub}</span>}
                </span>
                {row.value ? (
                  <span className="shrink-0 text-[12px] font-semibold text-forest-900">{row.value}</span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                )}
              </>
            );
            return row.href ? (
              <Link
                key={row.label}
                href={row.href}
                className="flex w-full items-center gap-3 px-3 py-3 transition hover:bg-leaf-mint/50"
              >
                {inner}
              </Link>
            ) : (
              <div key={row.label} className="flex w-full items-center gap-3 px-3 py-3">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
