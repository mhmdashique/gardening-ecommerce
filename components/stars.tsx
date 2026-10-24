import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  count,
  size = "sm",
  showValue = false,
  className,
}: {
  rating: number;
  count?: number;
  size?: "xs" | "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const dimension = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`${rating} out of 5 stars${count ? `, ${count} reviews` : ""}`}>
      <span className="flex items-center gap-0.5 text-amber">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star;
          const half = !filled && rounded >= star - 0.5;
          return (
            <span key={star} className="relative inline-flex">
              <Star className={cn(dimension, "text-amber/30")} fill="currentColor" strokeWidth={0} aria-hidden />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                  aria-hidden
                >
                  <Star className={cn(dimension, "text-amber")} fill="currentColor" strokeWidth={0} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && <span className="text-xs font-semibold text-forest-900">{rating.toFixed(1)}</span>}
      {typeof count === "number" && <span className="text-[11px] text-muted">({count})</span>}
    </div>
  );
}
