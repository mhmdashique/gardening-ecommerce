import type { ProductFilters } from "@/lib/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilters(searchParams: RawSearchParams): {
  filters: ProductFilters;
  values: Record<string, string | undefined>;
} {
  const q = first(searchParams.q)?.trim() || undefined;
  const category = first(searchParams.category)?.trim() || undefined;
  const minPriceRaw = first(searchParams.minPrice);
  const maxPriceRaw = first(searchParams.maxPrice);
  const light = first(searchParams.light) || undefined;
  const water = first(searchParams.water) || undefined;
  const size = first(searchParams.size) || undefined;
  const petFriendly = first(searchParams.petFriendly) === "1";
  const sort = first(searchParams.sort) || "popular";
  const page = Math.max(1, Number(first(searchParams.page) ?? 1) || 1);

  const minPrice = minPriceRaw && !Number.isNaN(Number(minPriceRaw)) ? Number(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw && !Number.isNaN(Number(maxPriceRaw)) ? Number(maxPriceRaw) : undefined;

  return {
    filters: {
      q,
      category,
      minPrice,
      maxPrice,
      light,
      water,
      size,
      petFriendly,
      sort,
      page,
      perPage: 12,
    },
    values: {
      q,
      category,
      minPrice: minPriceRaw || undefined,
      maxPrice: maxPriceRaw || undefined,
      light,
      water,
      size,
      petFriendly: petFriendly ? "1" : undefined,
      sort,
    },
  };
}
