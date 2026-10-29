import type { ReactNode } from "react";
import { Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared premium building blocks for the account area.
 * Matches the dashboard: dark forest hero, white surfaces with layered shadows,
 * large radii and uppercase micro-labels.
 */

/** White card surface with the layered premium shadow. */
export const premiumSurface =
  "rounded-3xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(18,56,42,0.04),0_20px_48px_-32px_rgba(18,56,42,0.45)]";

/** Small uppercase label used above card titles. */
export function CardLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[10px] font-semibold uppercase tracking-[0.16em] text-muted", className)}>
      {children}
    </p>
  );
}

/** Dark forest hero used at the top of each account page. */
export function PremiumHero({
  eyebrow,
  title,
  description,
  avatar,
  aside,
  children,
  compact = false,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  avatar?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-[#0d2b1e] text-white ring-1 ring-white/10 shadow-[0_30px_70px_-40px_rgba(13,43,30,0.9)]",
        compact ? "px-4 py-5" : "px-5 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#2f7a56]/35 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#c8a45a]/10 blur-3xl"
      />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-10 h-52 w-52 rotate-[22deg] text-white/[0.04]"
      />

      <div className="relative">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 ring-1 ring-white/10">
            {eyebrow}
          </span>
        )}
        <div
          className={cn(
            "flex flex-wrap gap-4",
            aside ? "items-start justify-between" : "items-center",
            eyebrow && "mt-3",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            {avatar}
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-semibold leading-tight tracking-tight",
                  compact ? "text-[19px]" : "text-[26px] sm:text-[32px]",
                )}
              >
                {title}
              </h1>
              {description && (
                <div
                  className={cn(
                    "text-white/60",
                    compact
                      ? "mt-0.5 text-[11px]"
                      : "mt-2 max-w-md text-[12.5px] leading-relaxed",
                  )}
                >
                  {description}
                </div>
              )}
            </div>
          </div>
          {aside && <div className="flex shrink-0 flex-col items-end gap-3">{aside}</div>}
        </div>
      </div>

      {children && <div className="relative mt-4">{children}</div>}
    </section>
  );
}

/** Premium stat tile (icon tile + uppercase label + value). */
export function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone: string;
  className?: string;
}) {
  return (
    <div className={cn(premiumSurface, "p-3 sm:p-4", className)}>
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl",
          tone,
        )}
      >
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
      </span>
      <CardLabel className="mt-2 text-[8.5px] tracking-[0.14em] sm:mt-3 sm:text-[10px]">
        {label}
      </CardLabel>
      <p className="mt-0.5 truncate text-[15px] font-semibold tabular-nums tracking-tight text-forest-950 sm:mt-1 sm:text-[22px]">
        {value}
      </p>
    </div>
  );
}
