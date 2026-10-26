"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { SafeImage } from "@/components/safe-image";
import { Stars } from "@/components/stars";
import { useToast } from "@/components/toast";
import { toggleWishlistAction } from "@/lib/actions/account";
import { formatINR } from "@/lib/utils";
import { minPrice } from "@/lib/product-utils";
import type { CartLine, Product } from "@/lib/types";

/**
 * Phone-only wishlist list styled after the mobile reference design:
 * image on the left, heart toggle on the right, rating row and a
 * full-width dark "Add to Cart" button that bags the first in-stock size.
 * Rendered inside a `sm:hidden` wrapper — desktop keeps WishlistGrid.
 */
export function WishlistRows({ products, loggedIn = true }: { products: Product[]; loggedIn?: boolean }) {
  const [items, setItems] = useState(products);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addLine } = useCart();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const remove = (product: Product) => {
    if (!loggedIn) {
      toast("Log in to manage your wishlist.", "info");
      return;
    }
    setPendingId(product.id);
    startTransition(async () => {
      const result = await toggleWishlistAction(product.id);
      setPendingId(null);
      if (result.loginRequired) {
        toast(result.error ?? "Please log in.", "info");
        return;
      }
      if (!result.wishlisted) {
        setItems((current) => current.filter((entry) => entry.id !== product.id));
        toast("Removed from your wishlist.");
      }
    });
  };

  const addToCart = (product: Product) => {
    const activeVariants = product.variants.filter((variant) => variant.is_active);
    const variant = activeVariants.find((entry) => entry.stock > 0) ?? activeVariants[0];
    if (!variant || variant.stock <= 0) {
      toast("This plant is currently out of stock.", "info");
      return;
    }
    setAddingId(product.id);
    const line: CartLine = {
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: variant.sku,
      image: product.images[0] ?? "/images/plant-placeholder.svg",
      size: variant.size,
      potType: variant.pot_type,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      qty: 1,
      stock: variant.stock,
      categoryId: product.category_id,
    };
    addLine(line, 1);
    setAddingId(null);
    toast(`${product.name} added to your bag.`);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <Heart className="mx-auto h-6 w-6 text-forest-300" strokeWidth={1.8} />
        <p className="mt-2.5 text-[13.5px] font-semibold text-forest-950">Your wishlist is waiting</p>
        <p className="mt-1 text-[11.5px] text-muted">Tap the heart on any plant to keep it here for later.</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-forest-900 px-5 text-[12.5px] font-semibold text-white transition hover:bg-forest-800"
        >
          Find something lovely
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((product) => {
        const activeVariants = product.variants.filter((variant) => variant.is_active);
        const variant = activeVariants.find((entry) => entry.stock > 0) ?? activeVariants[0];
        const price = variant?.price ?? minPrice(product);
        const inStock = Boolean(variant && variant.stock > 0);
        return (
          <li key={product.id} className="rounded-2xl border border-line bg-white p-3 shadow-card">
            <div className="flex items-start gap-3">
              <Link
                href={`/product/${product.slug}`}
                className="relative h-20 w-[68px] shrink-0 overflow-hidden rounded-xl bg-leaf-mint"
                aria-label={`View ${product.name}`}
              >
                <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="68px" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/product/${product.slug}`} className="truncate text-[13px] font-semibold text-forest-950">
                    {product.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(product)}
                    disabled={pendingId === product.id}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-danger transition hover:bg-danger-soft"
                  >
                    {pendingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4 fill-current" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
                <p className="text-[14px] font-bold tracking-tight text-forest-950">{formatINR(price)}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Stars rating={product.rating} size="xs" />
                  <span className="text-[9.5px] text-muted">({product.review_count})</span>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={!inStock || addingId === product.id}
                  className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-forest-800 text-[12px] font-semibold text-white transition hover:bg-forest-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                  {inStock ? "Add to Cart" : "Sold out"}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
