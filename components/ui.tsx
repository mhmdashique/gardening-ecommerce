import { cn, formatNumber, paymentStatusLabel, statusTone } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Inbox } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "danger" | "amber" | "dark";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
    {
      "bg-forest-800 text-white shadow-sm hover:bg-forest-900 active:bg-forest-950": variant === "primary",
      "border border-line bg-white text-forest-900 shadow-sm hover:border-forest-300 hover:bg-leaf-mint":
        variant === "secondary",
      "text-forest-800 hover:bg-forest-50": variant === "ghost",
      "bg-leaf-soft text-forest-800 hover:bg-forest-100": variant === "soft",
      "bg-danger text-white hover:bg-danger-ink": variant === "danger",
      "bg-amber text-forest-950 hover:bg-amber/90": variant === "amber",
      "bg-leaf-deep text-white hover:bg-forest-950": variant === "dark",
      "h-8 px-3 text-xs": size === "sm",
      "h-11 px-5 text-sm": size === "md",
      "h-12 px-6 text-[15px]": size === "lg",
      "h-11 w-11 p-0": size === "icon",
      "h-9 w-9 p-0": size === "icon-sm",
    },
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}

export function Badge({
  children,
  tone = "green",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "blue" | "violet" | "red" | "neutral" | "white";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "chip",
        {
          "bg-leaf-soft text-forest-800": tone === "green",
          "bg-amber-soft text-amber-ink": tone === "amber",
          "bg-sky-soft text-sky-ink": tone === "blue",
          "bg-violet-soft text-violet-ink": tone === "violet",
          "bg-danger-soft text-danger-ink": tone === "red",
          "bg-forest-50 text-muted": tone === "neutral",
          "bg-white/90 text-forest-900 shadow-sm backdrop-blur": tone === "white",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}

const chipStyles = {
  success: "bg-success-soft text-success-ink",
  amber: "bg-amber-soft text-amber-ink",
  blue: "bg-sky-soft text-sky-ink",
  violet: "bg-violet-soft text-violet-ink",
  danger: "bg-danger-soft text-danger-ink",
  neutral: "bg-forest-50 text-forest-800",
};

export function StatusChip({ status, dot = true }: { status: string; dot?: boolean }) {
  const tone = statusTone(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("chip capitalize", chipStyles[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {label}
    </span>
  );
}

/** Payment badge: green for captured money, yellow for anything still unpaid. */
export function PaymentStatusChip({ status, dot = true }: { status: string; dot?: boolean }) {
  const normalized = status.toLowerCase();
  const paid = normalized === "paid" || normalized === "captured";
  const refunded = normalized === "refunded";
  const failed = normalized === "failed";

  return (
    <span
      className={cn(
        "chip ring-1 ring-inset",
        paid && "bg-success-soft text-success-ink ring-success/30",
        !paid && refunded && "bg-forest-50 text-forest-800 ring-line",
        !paid && failed && "bg-danger-soft text-danger-ink ring-danger/25",
        !paid && !refunded && !failed && "bg-amber-soft text-amber-ink ring-amber/40",
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            paid ? "bg-success" : failed ? "bg-danger" : refunded ? "bg-forest-400" : "bg-amber",
          )}
          aria-hidden
        />
      )}
      {paymentStatusLabel(status)}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  change,
  tone = "green",
  className,
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
  icon: LucideIcon;
  change?: { value: string; positive?: boolean };
  tone?: "green" | "amber" | "blue" | "violet";
  className?: string;
}) {
  const tones = {
    green: "bg-leaf-soft text-forest-700",
    amber: "bg-amber-soft text-amber-ink",
    blue: "bg-sky-soft text-sky-ink",
    violet: "bg-violet-soft text-violet-ink",
  };
  return (
    <div className={cn("card flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-muted">{label}</p>
          <p className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-tight text-forest-950">
            {value}
          </p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      <div className="flex min-h-[18px] items-center gap-1.5 text-[11.5px] text-muted">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              change.positive === false ? "bg-danger-soft text-danger-ink" : "bg-success-soft text-success-ink",
            )}
          >
            <ArrowUpRight className={cn("h-3 w-3", change.positive === false && "rotate-90")} aria-hidden />
            {change.value}
          </span>
        )}
        {helper && <span>{helper}</span>}
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-1.5 text-[10px]">{eyebrow}</p>}
        <h2 className="display-title text-balance text-[22px] font-semibold leading-[1.12] text-forest-950 sm:text-[26px]">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted sm:text-[13px]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label-base" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-base", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input-base h-auto min-h-[110px] py-3", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("input-base cursor-pointer appearance-none bg-[length:16px] pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2366786d' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 12px center",
        backgroundRepeat: "no-repeat",
      }}
      {...props}
    />
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-forest-900", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-forest-300 text-forest-700 accent-forest-700 focus-visible:ring-2 focus-visible:ring-forest-400"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-xl bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]",
        className,
      )}
      aria-hidden
    />
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  titleClassName,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  /** Override the title styling (e.g. sans-serif inside the account area). */
  titleClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest-200 bg-leaf-mint/40 px-6 py-14 text-center", className)}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-forest-600 shadow-soft">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3
        className={cn(
          titleClassName ?? "font-display text-xl font-semibold text-forest-950",
          "mt-4",
        )}
      >
        {title}
      </h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function TinyStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-forest-950">{value}</p>
    </div>
  );
}

export function CountPill({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[11px] font-semibold text-forest-800">
      {formatNumber(count)}
    </span>
  );
}
