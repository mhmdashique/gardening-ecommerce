import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getProducts, getWishlistProducts } from "@/lib/catalog";
import { parseFilters, type RawSearchParams } from "@/lib/search-params";
import { Pagination, ShopControls } from "@/components/shop-controls";
import { ProductGrid } from "@/components/product-grid";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const { filters, values } = parseFilters(params);
  const user = await getCurrentUser();
  const [{ products, total, page, totalPages }, categories, wishlist] = await Promise.all([
    getProducts({ ...filters, perPage: 12 }),
    getCategories(),
    user ? getWishlistProducts(user.id) : Promise.resolve([]),
  ]);
  const wishlistIds = new Set(wishlist.map((product) => product.id));

  return (
    <div className="container-shell py-6 sm:py-8 lg:py-10">
      <p className="eyebrow mb-2">Search</p>
      <h1 className="display-title text-[28px] font-semibold leading-tight text-forest-950 sm:text-[36px]">
        {filters.q ? `Results for “${filters.q}”` : "Search Leaf & Pot"}
      </h1>
      <p className="mt-2 text-[13px] text-muted">
        {total} {total === 1 ? "product" : "products"} found
      </p>

      {!filters.q ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-dashed border-forest-200 bg-leaf-mint/40 p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-forest-600 shadow-soft">
              <Search className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-forest-950">What are you growing today?</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
              Use the search bar above, or start with one of these categories.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest-900 hover:border-forest-300"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <ShopControls
            categories={categories}
            values={values}
            total={total}
            basePath="/search"
            showCategory
          >
            <ProductGrid
              products={products}
              wishlistIds={wishlistIds}
              loggedIn={Boolean(user)}
              emptyTitle={`No results for “${filters.q}”`}
              emptyDescription="Try a shorter word, a plant type, or browse all plants."
            />
            <Pagination page={page} totalPages={totalPages} params={values} basePath="/search" />
          </ShopControls>
        </div>
      )}
    </div>
  );
}
