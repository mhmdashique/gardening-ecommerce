import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { premiumSurface } from "@/components/premium";

export interface MenuRow {
  label: string;
  sub?: string;
  /** Static trailing value (e.g. "English") renders instead of a chevron. */
  value?: string;
  /** Destination; omit for informational rows. */
  href?: string;
  icon: LucideIcon;
}

/**
 * Website-view menu card: a titled group of tappable rows (icon tile, label,
 * sub-label, chevron) using the premium account surface.
 */
export function MenuGroup({ title, rows }: { title?: string; rows: MenuRow[] }) {
  return (
    <section className={`${premiumSurface} overflow-hidden`}>
      {title && (
        <h2 className="border-b border-line/70 px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {title}
        </h2>
      )}
      <ul className="divide-y divide-line/60">
        {rows.map((row) => {
          const inner = (
            <>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 ring-1 ring-forest-100/70 transition group-hover:bg-leaf-mint">
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
                <ChevronRight className="h-4 w-4 shrink-0 text-forest-300 transition group-hover:translate-x-0.5" />
              )}
            </>
          );
          return (
            <li key={row.label}>
              {row.href ? (
                <Link
                  href={row.href}
                  className="group flex w-full items-center gap-3 px-5 py-4 transition hover:bg-leaf-mint/40"
                >
                  {inner}
                </Link>
              ) : (
                <div className="group flex w-full items-center gap-3 px-5 py-4">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
