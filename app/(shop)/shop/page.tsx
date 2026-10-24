import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getProducts, getWishlistProducts } from "@/lib/catalog";
import { parseFilters, type RawSearchParams } from "@/lib/search-params";
import { Pagination, ShopControls } from "@/components/shop-controls";
import { ProductGrid } from "@/components/product-grid";

export const metadata: Metadata = {
  title: "Shop All Plants, Pots & Garden Essentials",
  description:
    "Browse indoor plants, outdoor plants, succulents, planters and garden accessories. Filter by light, water, pet-friendliness and price.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const { filters, values } = parseFilters(params);
  const user = await getCurrentUser();
  const [{ products, total, page, totalPages }, categories, wishlist] = await Promise.all([
    getProducts(filters),
    getCategories(),
    user ? getWishlistProducts(user.id) : Promise.resolve([]),
  ]);
  const wishlistIds = new Set(wishlist.map((product) => product.id));

  return (
    <div className="container-shell py-6 sm:py-8 lg:py-10">
      <nav className="mb-5 flex items-center gap-1.5 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest-800">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-forest-900">Shop</span>
      </nav>

      <div className="mb-7 flex flex-col gap-2 sm:mb-8">
        <p className="eyebrow">The full collection</p>
        <h1 className="display-title text-[30px] font-semibold leading-tight text-forest-950 sm:text-[38px]">
          {filters.q ? `Results for “${filters.q}”` : "Shop All Plants"}
        </h1>
        <p className="max-w-2xl text-pretty text-[13px] leading-relaxed text-muted sm:text-sm">
          Hardy succulents, statement foliage, hand-finished pots and the little tools that make plant care a joy.
        </p>
      </div>

      <ShopControls
        categories={categories}
        values={values}
        total={total}
        basePath="/shop"
        showCategory={!filters.q}
      >
        <ProductGrid
          products={products}
          wishlistIds={wishlistIds}
          loggedIn={Boolean(user)}
          emptyTitle={filters.q ? "Nothing matched that search" : "No plants match those filters"}
          emptyDescription="Try removing a filter or searching for a different plant."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          params={values}
          basePath="/shop"
        />
      </ShopControls>
    </div>
  );
}
