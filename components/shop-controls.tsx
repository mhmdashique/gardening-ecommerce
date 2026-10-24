"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const lights = ["Low", "Medium", "Bright", "Full Sun"];
const waters = ["Low", "Medium", "High"];
const sizes = ["Pot", "With Plastic Cover", "Without Pot", "Cuttings", "Small", "Medium", "Large"];

interface FilterValues {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  light?: string;
  water?: string;
  petFriendly?: string;
  size?: string;
  sort?: string;
}

function FilterFields({
  categories,
  values,
  showCategory,
}: {
  categories: Category[];
  values: FilterValues;
  showCategory: boolean;
}) {
  return (
    <div className="space-y-5">
      {showCategory && (
        <div>
          <p className="label-base">Category</p>
          <Select name="category" defaultValue={values.category ?? ""} aria-label="Category">
            <option value="">All categories</option>
            {categories
              .filter((category) => category.slug !== "best-sellers")
              .map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
          </Select>
        </div>
      )}

      <div>
        <p className="label-base">Price range</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            name="minPrice"
            min={0}
            placeholder="Min"
            defaultValue={values.minPrice ?? ""}
            aria-label="Minimum price"
            className="h-10"
          />
          <span className="text-xs text-muted">to</span>
          <Input
            type="number"
            name="maxPrice"
            min={0}
            placeholder="Max"
            defaultValue={values.maxPrice ?? ""}
            aria-label="Maximum price"
            className="h-10"
          />
        </div>
      </div>

      <div>
        <p className="label-base">Light needs</p>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[11.5px] text-forest-900 transition has-[:checked]:border-forest-400 has-[:checked]:bg-leaf-soft">
            <input
              type="radio"
              name="light"
              value=""
              defaultChecked={!values.light}
              className="h-3.5 w-3.5 accent-forest-700"
            />
            Any light
          </label>
          {lights.map((light) => (
            <label
              key={light}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[11.5px] text-forest-900 transition has-[:checked]:border-forest-400 has-[:checked]:bg-leaf-soft"
            >
              <input
                type="radio"
                name="light"
                value={light}
                defaultChecked={values.light === light}
                className="h-3.5 w-3.5 accent-forest-700"
              />
              {light}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="label-base">Water need</p>
        <Select name="water" defaultValue={values.water ?? ""} aria-label="Water need">
          <option value="">Any water need</option>
          {waters.map((water) => (
            <option key={water} value={water}>
              {water}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <p className="label-base">Pot size</p>
        <Select name="size" defaultValue={values.size ?? ""} aria-label="Pot size">
          <option value="">Any size</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-[12px] text-forest-900 transition has-[:checked]:border-forest-400 has-[:checked]:bg-leaf-soft">
        <input
          type="checkbox"
          name="petFriendly"
          value="1"
          defaultChecked={values.petFriendly === "1"}
          className="h-4 w-4 accent-forest-700"
        />
        Pet-friendly plants only
      </label>

      {values.q && <input type="hidden" name="q" value={values.q} />}
      <input type="hidden" name="sort" value={values.sort ?? ""} />
    </div>
  );
}

export function ShopControls({
  categories,
  values,
  basePath = "/shop",
  showCategory = true,
  total,
  children,
}: {
  categories: Category[];
  values: FilterValues;
  basePath?: string;
  showCategory?: boolean;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCount = ["category", "minPrice", "maxPrice", "light", "water", "size", "petFriendly"].filter(
    (key) => Boolean(values[key as keyof FilterValues]),
  ).length;

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort) params.set("sort", sort);
    else params.delete("sort");
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          <span className="font-semibold text-forest-900">{total}</span> {total === 1 ? "product" : "products"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-xs font-semibold text-forest-900 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-forest-800 text-[10px] text-white">{activeCount}</span>
            )}
          </button>
          <label htmlFor="sort" className="sr-only">
            Sort products
          </label>
          <Select
            id="sort"
            value={values.sort ?? "popular"}
            onChange={(event) => updateSort(event.target.value)}
            className="h-10 w-auto min-w-[155px] text-xs"
          >
            <option value="popular">Most popular</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <form action={basePath} method="get" className="sticky top-[104px] rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-forest-950">Filters</p>
              <a href={basePath} className="text-[10.5px] font-medium text-muted hover:text-forest-800">
                Clear all
              </a>
            </div>
            <FilterFields categories={categories} values={values} showCategory={showCategory} />
            <Button type="submit" size="sm" className="mt-5 w-full">
              Apply filters
            </Button>
          </form>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Product filters">
          <button
            type="button"
            className="absolute inset-0 bg-forest-950/45 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-lift animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-forest-950">Filters</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-leaf-mint text-forest-800"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={basePath} method="get" onSubmit={() => setOpen(false)}>
              <FilterFields categories={categories} values={values} showCategory={showCategory} />
              <div className="mt-6 grid grid-cols-2 gap-2">
                <a href={basePath} className="inline-flex h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold text-forest-900">
                  Clear
                </a>
                <Button type="submit">Apply filters</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function Pagination({
  page,
  totalPages,
  params,
  basePath,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (totalPages <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page") query.set(key, value);
    });
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const pages = Array.from({ length: totalPages }).map((_, index) => index + 1);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <a href={href(page - 1)} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3 text-xs font-medium text-forest-900 hover:bg-leaf-mint">
          Previous
        </a>
      )}
      {pages.map((number) => (
        <a
          key={number}
          href={href(number)}
          aria-current={number === page ? "page" : undefined}
          className={cn(
            "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-xs font-medium",
            number === page
              ? "border-forest-800 bg-forest-800 text-white"
              : "border-line bg-white text-forest-900 hover:bg-leaf-mint",
          )}
        >
          {number}
        </a>
      ))}
      {page < totalPages && (
        <a href={href(page + 1)} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3 text-xs font-medium text-forest-900 hover:bg-leaf-mint">
          Next
        </a>
      )}
    </nav>
  );
}
