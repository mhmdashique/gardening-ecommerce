"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
import { buttonClasses } from "@/components/ui";
import Link from "next/link";
import type { Product } from "@/lib/types";

export function WishlistGrid({ products }: { products: Product[] }) {
  const [items, setItems] = useState(products);

  useEffect(() => {
    setItems(products);
  }, [products]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is waiting"
        description="Tap the heart on any plant to keep it here for later."
        action={
          <Link href="/shop" className={buttonClasses()}>
            Find something lovely
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wishlisted
          loggedIn
          onRemoved={() => setItems((current) => current.filter((entry) => entry.id !== product.id))}
        />
      ))}
    </div>
  );
}
