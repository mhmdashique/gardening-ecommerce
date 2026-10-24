import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Droplets,
  Heart,
  Leaf,
  ShieldCheck,
  Sun,
  ThermometerSun,
  Truck,
  Wind,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
  getSettings,
  getWishlistProducts,
} from "@/lib/catalog";
import { minPrice } from "@/lib/product-utils";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { ProductPurchase } from "@/components/product-purchase";
import { Stars } from "@/components/stars";
import { Badge, SectionHeading } from "@/components/ui";
import { ViewTracker } from "@/components/view-tracker";
import { formatDate, formatINR } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Plant not found" };
  return {
    title: `${product.name} — ${product.category_name}`,
    description: product.short_description ?? product.description.slice(0, 155),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} | Leaf & Pot`,
      description: product.short_description ?? product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0], alt: product.name }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.is_active) notFound();

  const user = await getCurrentUser();
  const [reviews, related, wishlist, settings] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product, 4),
    user ? getWishlistProducts(user.id) : Promise.resolve([]),
    getSettings(),
  ]);
  const wishlistIds = new Set(wishlist.map((entry) => entry.id));
  const variants = product.variants.filter((variant) => variant.is_active);
  const inStock = variants.some((variant) => variant.stock > 0);
  const price = minPrice(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: variants[0]?.sku,
    brand: { "@type": "Brand", name: "Leaf & Pot" },
    category: product.category_name,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/product/${product.slug}`,
    },
    aggregateRating:
      product.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.review_count,
          }
        : undefined,
  };

  return (
    <div className="container-shell py-5 sm:py-7 lg:py-9">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ViewTracker productId={product.id} />

      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest-800">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/shop" className="hover:text-forest-800">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/category/${product.category_slug}`} className="hover:text-forest-800">{product.category_name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-forest-900">{product.name}</span>
      </nav>

      <div className="grid gap-7 lg:grid-cols-[1fr_1fr] lg:gap-10 xl:gap-14">
        <div className="lg:sticky lg:top-[104px] lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>
        <ProductPurchase
          product={product}
          wishlisted={wishlistIds.has(product.id)}
          loggedIn={Boolean(user)}
          freeShippingThreshold={settings.free_shipping_threshold}
        />
      </div>

      <section className="mt-12 grid gap-6 border-t border-line pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <p className="eyebrow">Plant care</p>
          <h2 className="display-title mt-2 text-[24px] font-semibold text-forest-950 sm:text-[28px]">
            Everything it needs to thrive
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
            A little attention goes a long way. Here&apos;s how to keep your {product.name} happy in its new home.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Sun, title: "Light", value: product.light, copy: "Placement suited to this plant's natural habitat." },
              { icon: Droplets, title: "Water", value: product.water, copy: "Water when the top layer of soil feels dry." },
              { icon: ThermometerSun, title: "Difficulty", value: product.difficulty, copy: "How much attention it likes from its plant parent." },
              { icon: Wind, title: "Air", value: product.air_purifying ? "Purifying" : "Natural", copy: "A little fresher air for your space." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-line bg-white p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-soft text-forest-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{item.title}</p>
                <p className="text-sm font-semibold text-forest-950">{item.value}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-leaf-mint/50 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-forest-600" />
            <p className="text-[12px] font-semibold uppercase tracking-wider text-forest-800">Care guide</p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-forest-900">
            {product.care_guide ?? "Water regularly, give it bright indirect light, and it will settle in beautifully."}
          </p>
          <div className="mt-5 grid gap-2.5">
            {[
              { icon: Truck, label: "Carefully packed", copy: "Root-safe transit packaging, dispatched in 24–48 hours." },
              { icon: ShieldCheck, label: "7-day damage cover", copy: "Damaged during transit? Replaced free within 7 days with photo proof." },
              { icon: AlertCircle, label: "No returns available", copy: "As delicate perishable live goods, standard returns are not accepted." },
              { icon: Heart, label: "Free care support", copy: "Message our botanical experts whenever you need guidance." },
            ].map((item) => (
              <div key={item.label} className="flex gap-2.5">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                <div>
                  <p className="text-[11.5px] font-semibold text-forest-950">{item.label}</p>
                  <p className="text-[10.5px] leading-relaxed text-muted">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="mt-12 border-t border-line pt-8">
        <SectionHeading
          eyebrow="Real plant parents"
          title="Reviews"
          description={reviews.length ? "Notes from people who took this plant home." : "Be the first to bring this plant home and tell us how it grows."}
        />
        <div className="mt-6 grid gap-7 lg:grid-cols-[260px_1fr] lg:gap-12">
          <div className="h-fit rounded-2xl border border-line bg-white p-5">
            <p className="font-display text-[46px] font-semibold leading-none text-forest-950">{product.rating.toFixed(1)}</p>
            <Stars rating={product.rating} size="md" className="mt-2" />
            <p className="mt-2 text-[11px] text-muted">Based on {product.review_count} verified reviews</p>
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((review) => review.rating === star).length;
                const percent = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[10px] text-muted">
                    <span className="w-3">{star}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-50">
                      <span className="block h-full rounded-full bg-amber" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-forest-200 bg-leaf-mint/40 p-8 text-center">
                <p className="font-display text-lg font-semibold text-forest-950">No reviews yet</p>
                <p className="mt-1 text-xs text-muted">
                  Reviews can be written after a delivered order. We publish them once verified.
                </p>
                {user && (
                  <Link href="/account/orders" className="mt-3 inline-block text-xs font-semibold text-forest-700 underline underline-offset-4">
                    Go to my orders
                  </Link>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf-soft text-[11px] font-bold text-forest-800">
                          {review.customer_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                        </span>
                        <div>
                          <p className="text-[12.5px] font-semibold text-forest-950">{review.customer_name}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Stars rating={review.rating} size="xs" />
                            {review.order_id && <Badge tone="green">Verified purchase</Badge>}
                          </div>
                        </div>
                      </div>
                      <time className="text-[10px] text-muted" dateTime={review.created_at}>
                        {formatDate(review.created_at)}
                      </time>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-forest-900">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <SectionHeading
          eyebrow="Keep growing"
          title="You may also love"
          action={
            <Link href={`/category/${product.category_slug}`} className="text-xs font-semibold text-forest-700 underline decoration-forest-300 underline-offset-4">
              More {product.category_name}
            </Link>
          }
        />
        <div className="mt-5">
          <ProductGrid
            products={related}
            wishlistIds={wishlistIds}
            loggedIn={Boolean(user)}
            className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
          />
        </div>
      </section>

      <p className="mt-8 text-[10.5px] text-muted">
        Listed price {formatINR(price)}. Colours and leaf patterns vary naturally — every plant is a little different.
      </p>
    </div>
  );
}
