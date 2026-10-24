import type { Product, ProductVariant } from "@/lib/types";

export function defaultVariant(product: Product): ProductVariant | undefined {
  const active = product.variants.filter((v) => v.is_active);
  return active.find((v) => v.stock > 0) ?? active[0];
}

export function minPrice(product: Product): number {
  const active = product.variants.filter((v) => v.is_active);
  if (!active.length) return 0;
  return Math.min(...active.map((v) => v.price));
}

export function comparePrice(product: Product): number | null {
  const variant = defaultVariant(product);
  return variant?.compare_at_price ?? null;
}

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + (v.is_active ? v.stock : 0), 0);
}

export function productImage(product: Pick<Product, "images">): string {
  return product.images[0] || "/images/plant-placeholder.svg";
}

export function variantLabel(variant: Pick<ProductVariant, "size" | "pot_type">) {
  return [variant.size, variant.pot_type].filter(Boolean).join(" · ");
}

export function isInStock(product: Product): boolean {
  return totalStock(product) > 0;
}
