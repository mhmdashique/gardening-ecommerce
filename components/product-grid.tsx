import Link from "next/link";
import { Sprout } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { EmptyState, buttonClasses } from "@/components/ui";
import type { Product } from "@/lib/types";

export function ProductGrid({
  products,
  wishlistIds = new Set<string>(),
  loggedIn = false,
  emptyTitle = "No plants found",
  emptyDescription = "Try widening your filters or exploring another category.",
  className,
}: {
  products: Product[];
  wishlistIds?: Set<string>;
  loggedIn?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  if (!products.length) {
    return (
      <EmptyState
        icon={Sprout}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link href="/shop" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Browse all plants
          </Link>
        }
      />
    );
  }
  return (
    <div className={className ?? "grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          wishlisted={wishlistIds.has(product.id)}
          loggedIn={loggedIn}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
