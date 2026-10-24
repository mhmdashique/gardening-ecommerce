"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, Heart, ShoppingBag } from "lucide-react";
import { defaultVariant, minPrice, totalStock } from "@/lib/product-utils";
import { toggleWishlistAction } from "@/lib/actions/account";
import { SafeImage } from "@/components/safe-image";
import { Stars } from "@/components/stars";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  wishlisted = false,
  loggedIn = false,
  priority = false,
  compact = false,
  className,
  onRemoved,
}: {
  product: Product;
  wishlisted?: boolean;
  loggedIn?: boolean;
  priority?: boolean;
  compact?: boolean;
  className?: string;
  onRemoved?: () => void;
}) {
  const activeVariants = product.variants.filter((entry) => entry.is_active);
  const [variantId, setVariantId] = useState(defaultVariant(product)?.id ?? "");
  const variant = activeVariants.find((entry) => entry.id === variantId) ?? defaultVariant(product);
  const [saved, setSaved] = useState(wishlisted);

  useEffect(() => {
    setSaved(wishlisted);
  }, [wishlisted]);
  const [wishPending, startWish] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const price = variant?.price ?? minPrice(product);
  const compare = variant?.compare_at_price ?? null;
  const discount = discountPercent(price, compare);
  const stock = totalStock(product);
  const selectedStock = variant?.stock ?? 0;

  const toggleWishlist = () => {
    if (!loggedIn) {
      toast("Save plants for later — log in to create your wishlist.", "info");
      router.push(`/login?next=/product/${product.slug}`);
      return;
    }
    startWish(async () => {
      const result = await toggleWishlistAction(product.id);
      if (result.loginRequired) {
        toast(result.error ?? "Please log in.", "info");
        return;
      }
      setSaved(Boolean(result.wishlisted));
      toast(result.wishlisted ? "Saved to your wishlist." : "Removed from your wishlist.");
      if (!result.wishlisted) onRemoved?.();
    });
  };

  const productHref = `/product/${product.slug}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white p-2 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-card sm:p-2.5",
        className,
      )}
    >
      <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-leaf-mint sm:mb-2.5">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0" aria-label={`View ${product.name}`}>
          <SafeImage
            src={product.images[0] ?? "/images/plant-placeholder.svg"}
            alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
            priority={priority}
            className="transition duration-700 group-hover:scale-[1.04]"
          />
        </Link>
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {product.badge && (
            <Badge
              tone={product.badge === "New" ? "blue" : product.badge === "Popular" ? "violet" : "amber"}
              className="px-1.5 py-0.5 text-[9.5px] shadow-sm"
            >
              {product.badge}
            </Badge>
          )}
          {discount > 0 && <Badge tone="green" className="px-1.5 py-0.5 text-[9.5px] shadow-sm">{discount}% off</Badge>}
        </div>
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishPending}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className={cn(
            "absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/70 bg-white/90 shadow-sm backdrop-blur transition hover:scale-105",
            saved ? "text-danger" : "text-forest-700 hover:text-danger",
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} strokeWidth={1.8} />
        </button>
        {stock === 0 && (
          <div className="absolute inset-x-2 bottom-2 z-10 rounded-md bg-white/95 px-1.5 py-1 text-center text-[10px] font-semibold text-danger-ink shadow-sm">
            Out of stock
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-0.5 pb-0.5">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{product.category_name}</p>
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-1 text-[12.5px] font-semibold text-forest-950 transition hover:text-forest-700 sm:text-[13px]"
          title={product.name}
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-center justify-between gap-1">
          <Stars rating={product.rating} count={product.review_count} size="xs" />
          <span className="text-[9.5px] text-muted">({product.review_count})</span>
        </div>
        {!compact && activeVariants.length > 1 && (
          <div className="relative mt-1.5">
            <label htmlFor={`variant-${product.id}`} className="sr-only">
              Choose a size for {product.name}
            </label>
            <select
              id={`variant-${product.id}`}
              value={variant?.id ?? ""}
              onChange={(event) => setVariantId(event.target.value)}
              className="h-7 w-full appearance-none rounded-md border border-line bg-white pl-2 pr-6 text-[10.5px] font-medium text-forest-900 outline-none transition hover:border-forest-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-100"
            >
              {activeVariants.map((entry) => (
                <option key={entry.id} value={entry.id} disabled={entry.stock <= 0}>
                  {entry.size} · {formatINR(entry.price)}
                  {entry.stock <= 0 ? " (sold out)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-forest-600"
              aria-hidden
            />
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-2">
          <div>
            <p className="text-[13.5px] font-bold text-forest-950 sm:text-[14px]">{formatINR(price)}</p>
            {compare && compare > price && (
              <p className="text-[10px] text-muted line-through">{formatINR(compare)}</p>
            )}
          </div>
          {!compact &&
            (selectedStock <= 0 ? (
              <span
                className="inline-flex h-7 cursor-not-allowed items-center rounded-lg bg-forest-200 px-2.5 text-[10.5px] font-semibold text-forest-600 sm:h-8 sm:text-[11px]"
                aria-label={`${product.name} is out of stock`}
              >
                Sold
              </span>
            ) : (
              <Link
                href={productHref}
                className="inline-flex h-7 items-center gap-1 rounded-lg bg-forest-800 px-2.5 text-[10.5px] font-semibold text-white transition hover:bg-forest-900 sm:h-8 sm:text-[11px]"
                aria-label={`Open ${product.name} details page`}
              >
                <ShoppingBag className="h-3 w-3" aria-hidden />
                Add
              </Link>
            ))}
        </div>
      </div>
    </article>
  );
}
