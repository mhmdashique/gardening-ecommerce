import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { cn, formatNumber } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function CategoryCard({
  category,
  className,
  large = false,
}: {
  category: Category;
  className?: string;
  large?: boolean;
}) {
  return (
    <Link
      href={category.slug === "best-sellers" ? "/shop?sort=rating" : `/category/${category.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-forest-900 shadow-sm transition hover:shadow-lift",
        large ? "aspect-[4/3]" : "aspect-[4/5]",
        className,
      )}
    >
      <SafeImage
        src={category.image_url ?? "/images/plant-placeholder.svg"}
        alt={category.name}
        sizes="(max-width: 640px) 33vw, 260px"
        className="opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-3.5">
        <div>
          <h3 className="font-display text-[14px] font-semibold leading-tight text-white sm:text-[15.5px]">{category.name}</h3>
          <p className="mt-0.5 text-[10px] text-white/70">
            {formatNumber(category.product_count ?? 0)} {(category.product_count ?? 0) === 1 ? "plant" : "plants"}
          </p>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white group-hover:text-forest-900">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function CategoryIconTile({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <Link
      href={category.slug === "best-sellers" ? "/shop?sort=rating" : `/category/${category.slug}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-forest-900 transition hover:border-forest-100 hover:bg-leaf-mint",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-leaf-soft text-forest-600">
        <SafeImage
          src={category.image_url ?? "/images/plant-placeholder.svg"}
          alt=""
          sizes="36px"
          className="h-9 w-9 rounded-lg object-cover"
        />
      </span>
      <span className="flex-1 truncate">{category.name}</span>
      <span className="text-[11px] text-muted">{category.product_count ?? 0}</span>
    </Link>
  );
}
