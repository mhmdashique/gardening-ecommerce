import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getCategoryBySlug, getProducts, getWishlistProducts } from "@/lib/catalog";
import { parseFilters, type RawSearchParams } from "@/lib/search-params";
import { Pagination, ShopControls } from "@/components/shop-controls";
import { ProductGrid } from "@/components/product-grid";
import { SafeImage } from "@/components/safe-image";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} — Buy Online`,
    description: category.description ?? `Shop ${category.name} at Leaf & Pot.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category || !category.is_active) notFound();

  const { filters, values } = parseFilters(rawParams);
  const user = await getCurrentUser();
  const [{ products, total, page, totalPages }, categories, wishlist] = await Promise.all([
    getProducts({ ...filters, category: category.slug, perPage: 12 }),
    getCategories(),
    user ? getWishlistProducts(user.id) : Promise.resolve([]),
  ]);
  const wishlistIds = new Set(wishlist.map((product) => product.id));

  return (
    <div>
      <section className="relative overflow-hidden bg-forest-900">
        {category.image_url && (
          <>
            <SafeImage src={category.image_url} alt="" sizes="100vw" className="opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/75 to-forest-900/30" />
          </>
        )}
        <div className="container-shell relative py-9 sm:py-12 lg:py-14">
          <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-white/55" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/85">{category.name}</span>
          </nav>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-200">Shop by category</p>
          <h1 className="display-title mt-2 text-[32px] font-semibold leading-tight text-white sm:text-[42px]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-xl text-pretty text-[13px] leading-relaxed text-white/65 sm:text-sm">
              {category.description}
            </p>
          )}
          <p className="mt-4 text-[11.5px] text-white/50">{category.product_count ?? total} products</p>
        </div>
      </section>

      <div className="container-shell py-6 sm:py-8">
        <ShopControls
          categories={categories}
          values={values}
          total={total}
          basePath={`/category/${category.slug}`}
          showCategory={false}
        >
          <ProductGrid
            products={products}
            wishlistIds={wishlistIds}
            loggedIn={Boolean(user)}
            emptyTitle="No products in this category yet"
            emptyDescription="We're growing this collection. Explore all plants in the meantime."
          />
          <Pagination page={page} totalPages={totalPages} params={values} basePath={`/category/${category.slug}`} />
        </ShopControls>
      </div>
    </div>
  );
}
