import Link from "next/link";
import { cn } from "@/lib/utils";

export function LeafMark({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M31.8 7.2C22 7.4 12.4 12.2 9.4 21.2c-2 6 1.4 11.5 7.4 11.6 9.1.1 14.6-9.8 15-25.6Z"
        fill={color}
      />
      <path d="M10.5 33.5C13.8 24.2 19.9 16.4 29 10.7" stroke="#f4faf5" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 11.2c5.7-.7 9.7 1.7 10.4 6.3-4.8 1-8.9-1.4-10.4-6.3Z"
        fill={color}
        opacity="0.55"
      />
    </svg>
  );
}

export function Brand({
  theme = "dark",
  size = "md",
  withTagline = true,
  href = "/",
  className,
}: {
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Leaf & Pot home">
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full",
          theme === "dark" ? "bg-forest-800 text-white" : "bg-white/10 text-white",
          size === "sm" ? "h-9 w-9" : size === "md" ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <span className="absolute inset-0 rounded-full border border-white/20 animate-rotate" />
        <LeafMark className={size === "sm" ? "h-5 w-5" : size === "md" ? "h-6 w-6" : "h-7 w-7"} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "display-title font-semibold tracking-tight",
            theme === "dark" ? "text-forest-950" : "text-white",
            size === "sm" ? "text-[17px]" : size === "md" ? "text-[20px]" : "text-[23px]",
          )}
        >
          Leaf <span className={theme === "dark" ? "text-forest-600" : "text-forest-200"}>&</span> Pot
        </span>
        {withTagline && (
          <span
            className={cn(
              "mt-1 text-[8.5px] font-semibold uppercase tracking-[0.24em]",
              theme === "dark" ? "text-muted" : "text-white/60",
            )}
          >
            Green Home. Happy You.
          </span>
        )}
      </span>
    </Link>
  );
}
