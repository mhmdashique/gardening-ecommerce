import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  Headphones,
  Home,
  Leaf,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Trees,
  Truck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllProducts,
  getBanners,
  getBestSellers,
  getSettings,
  getWishlistProducts,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { WatchVideoButton } from "@/components/hero-video";
import { SafeImage } from "@/components/safe-image";
import { SectionHeading, buttonClasses } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import type { Product, SiteSettings } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "Leaf & Pot | Live Plants for Landscaping, Gardening, Homes & Offices" },
  description:
    "We deliver all types of plants for landscaping, gardening, houses, shops, and offices for wholesale and retail.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const [heroBanners, offerBanners, allProducts, bestSellers, settings] = await Promise.all([
    getBanners("hero"),
    getBanners("offer"),
    getAllProducts(),
    getBestSellers(8),
    getSettings(),
  ]);

  const wishlist = user ? await getWishlistProducts(user.id) : [];
  const wishlistIds = new Set(wishlist.map((product) => product.id));

  return (
    <LandingHome
      hero={heroBanners[0] ?? null}
      offer={offerBanners[0] ?? null}
      allProducts={allProducts}
      bestSellers={bestSellers}
      settings={settings}
      wishlistIds={wishlistIds}
      loggedIn={Boolean(user)}
    />
  );
}

function TrustStrip({ settings }: { settings: SiteSettings }) {
  return (
    <div className="border-b border-line bg-white/90">
      <div className="container-shell grid sm:grid-cols-3">
        {[
          {
            icon: Truck,
            title: "Free Shipping",
            copy: `On all orders over ${formatINR(settings.free_shipping_threshold)}`,
          },
          {
            icon: Boxes,
            title: "Wholesale & Retail",
            copy: "Supplying landscaping, homes, shops & offices",
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className={`flex items-center gap-2.5 py-2 sm:py-2.5 ${
              index > 0 ? "border-t border-line sm:border-l sm:border-t-0 sm:pl-5" : ""
            }`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-mint text-forest-700">
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[11.5px] font-semibold text-forest-950">{item.title}</p>
              <p className="text-[10px] leading-tight text-muted">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutCompanySection() {
  const deliverySegments = [
    {
      icon: Trees,
      title: "Landscaping & Estates",
      tag: "Bulk Supply",
      description:
        "Large-scale delivery of architectural palms, outdoor ornamental shrubs, flowering borders, and tropical greens for resorts, hotels, villa projects, and commercial landscapes.",
    },
    {
      icon: Sprout,
      title: "Gardening & Terraces",
      tag: "Green Spaces",
      description:
        "Thriving plants for balcony styling, terrace gardens, and kitchen greens with rich potting mixes and healthy root systems ready to bloom.",
    },
    {
      icon: Home,
      title: "Houses & Residential",
      tag: "Everyday Living",
      description:
        "NASA-certified air purifiers, aesthetic indoor living room plants, and pet-friendly greens that refresh living rooms, dining spaces, and bedrooms.",
    },
    {
      icon: Store,
      title: "Shops & Commercial",
      tag: "Retail Spaces",
      description:
        "Eye-catching entrance greenery, hanging foliage, and low-maintenance plants curated to enhance customer atmosphere in cafes, boutiques, and retail shops.",
    },
    {
      icon: Building2,
      title: "Offices & Workplaces",
      tag: "Corporate Wellness",
      description:
        "Desk plants, floor-standing foliage, and natural air-filtering greenery that lower stress, boost workplace productivity, and clean indoor air.",
    },
  ];

  return (
    <section className="container-shell mt-12 sm:mt-16">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white to-leaf-cream/60 p-6 shadow-sm sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-leaf-mint/60 blur-3xl" aria-hidden />
        <div className="relative max-w-3xl">
          <p className="eyebrow">About our company</p>
          <h2 className="display-title mt-2 text-[26px] font-semibold leading-[1.12] text-forest-950 sm:text-[34px] lg:text-[38px]">
            Delivering Living Plants for Landscaping, Homes, Shops &amp; Offices
          </h2>
          <p className="mt-3.5 text-pretty text-[13.5px] leading-relaxed text-muted sm:text-[14.5px]">
            At <strong>Leaf &amp; Pot</strong>, all types of healthy, nursery-nurtured live plants are carefully packed and delivered across India. Whether you are executing a large landscaping project, styling a residential home, setting up a terrace garden, or decorating commercial shops and corporate offices — we provide both <strong>wholesale bulk supply</strong> and <strong>retail quantities</strong> directly to your doorstep.
          </p>
        </div>

        {/* 5 Delivery Sectors */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {deliverySegments.map((seg) => (
            <div
              key={seg.title}
              className="flex flex-col rounded-2xl border border-line bg-white/95 p-5 shadow-sm transition hover:border-forest-300 hover:shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-soft text-forest-800">
                  <seg.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-leaf-mint px-2 py-0.5 text-[9.5px] font-semibold text-forest-800">
                  {seg.tag}
                </span>
              </div>
              <h3 className="mt-3 text-[14px] font-semibold text-forest-950">{seg.title}</h3>
              <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-muted">{seg.description}</p>
            </div>
          ))}
        </div>

        {/* Wholesale & Retail Banner */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* Wholesale Box */}
          <div className="rounded-2xl border border-forest-800/20 bg-forest-900 p-6 text-white shadow-card">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-amber" />
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-forest-200">Wholesale Supply</span>
            </div>
            <h3 className="mt-2 text-[18px] font-semibold">Bulk Nursery Supply for Landscapers &amp; Businesses</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/75">
              Direct nursery-tier pricing, scheduled bulk dispatches, and custom logistics for landscaping contractors, architects, nurseries, florists, and commercial builders.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/90">
              <span className="rounded-md bg-white/10 px-2.5 py-1">Direct Nursery Pricing</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">Scheduled Batch Dispatch</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">All India Logistics</span>
            </div>
          </div>

          {/* Retail Box */}
          <div className="rounded-2xl border border-forest-200 bg-leaf-soft/60 p-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-forest-700" />
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-forest-800">Retail Orders</span>
            </div>
            <h3 className="mt-2 text-[18px] font-semibold text-forest-950">Direct-to-Doorstep for Plant Parents</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Choose your ideal plant variant: complete with pot (100% price), with plastic cover (80% price), without pot (75% price), or fresh cuttings (50% price). Delivered safely to your door.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-md bg-white px-2.5 py-1 font-medium text-forest-900 shadow-sm">4 Flexible Plant Variants</span>
              <span className="rounded-md bg-white px-2.5 py-1 font-medium text-forest-900 shadow-sm">Root-Safe Transit Packaging</span>
              <span className="rounded-md bg-white px-2.5 py-1 font-medium text-forest-900 shadow-sm">Free Plant Care Support</span>
            </div>
          </div>
        </div>

        {/* Guarantees & Returns Banner */}
        {/* <div className="mt-5 rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3 sm:border-l sm:border-line sm:pl-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber-ink">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-forest-950">No Return Available Policy</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  Because living plants are perishable biological organisms, once delivered safely they cannot be returned or refunded for change of mind.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:border-l sm:border-line sm:pl-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-leaf-mint text-forest-800">
                <Leaf className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-forest-950">Fresh from Nursery</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  All plants are sourced directly from nurseries and carefully packed for safe delivery.
                </p>
              </div>
            </div>
          </div>
        </div> */}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line/70 pt-6">
          <p className="text-[12px] font-medium text-forest-900">
            Need plants for your home, landscape project, shop, or corporate office?
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className={buttonClasses({ size: "sm", className: "h-9 px-4 text-xs font-semibold" })}
            >
              Shop All Plants <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/contact"
              className={buttonClasses({ variant: "secondary", size: "sm", className: "h-9 px-4 text-xs font-semibold" })}
            >
              Wholesale &amp; Bulk Enquiries
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingHome({
  hero,
  offer,
  allProducts,
  bestSellers,
  settings,
  wishlistIds = new Set<string>(),
  loggedIn = false,
}: {
  hero: import("@/lib/types").Banner | null;
  offer: import("@/lib/types").Banner | null;
  allProducts: Product[];
  bestSellers: Product[];
  settings: SiteSettings;
  wishlistIds?: Set<string>;
  loggedIn?: boolean;
}) {
  return (
    <div>
      {/* Full-Screen Hero Landing Cover - Content First */}
      <section className="relative flex min-h-[calc(100vh-64px)] min-h-[calc(100dvh-64px)] lg:min-h-[calc(100vh-72px)] lg:min-h-[calc(100dvh-72px)] flex-col justify-between overflow-hidden bg-[#faf9f5]">
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" aria-hidden />

        {/* Split hero: content left, image right */}
        <div className="container-shell relative z-10 flex flex-1 items-center py-6 sm:py-8 lg:py-10">
          <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Left Content */}
            <div className="flex flex-col justify-center animate-fade-up text-center lg:text-left max-w-[560px] mx-auto lg:mx-0">
              <div className="inline-flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-forest-700">
                <Leaf className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {hero?.eyebrow ?? "Bring Nature Home"}
              </div>
              <h1 className="font-display mt-3 text-balance text-[40px] font-semibold leading-[1.05] tracking-tight text-forest-950 sm:text-[50px] lg:text-[46px] xl:text-[56px]">
                {hero?.title ?? "Healthy Plants for a Happier You"}
              </h1>
              <p className="mt-4 mx-auto max-w-[48ch] text-pretty text-[14.5px] leading-[1.65] text-forest-800/80 sm:text-[15.5px] lg:mx-0">
                {hero?.subtitle ??
                  "Discover our handpicked indoor plants, balcony palms, hardy succulents and elegant pots. Fresh. Green. Delivered to your door."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-4 sm:gap-6 lg:justify-start">
                <a
                  href="#plants-collection"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-forest-900 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-950 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{hero?.cta_label ?? "Shop Now"}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <WatchVideoButton poster={hero?.image_url} />
              </div>
            </div>

            {/* Right: hero banner image */}
            <div className="relative mx-auto w-full max-w-[520px] animate-fade-up [animation-delay:140ms] lg:max-w-none">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-leaf-mint sm:h-52 sm:w-52" aria-hidden />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full border border-forest-800/10 bg-white/60 sm:h-36 sm:w-36" aria-hidden />
              <div className="relative h-64 overflow-hidden rounded-3xl border border-line bg-leaf-soft shadow-card sm:h-80 sm:rounded-4xl lg:h-[400px] xl:h-[440px]">
                <SafeImage
                  src={hero?.image_url ?? "/images/landing.png"}
                  alt={hero?.title ?? "Hand-nurtured plants delivered to your doorstep"}
                  priority
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                />
              </div>
              {/* Floating care badge */}
              <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-card sm:left-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-leaf-mint text-forest-800">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-[12px] font-semibold leading-tight text-forest-950">Live-arrival guaranteed</p>
                  <p className="text-[10.5px] leading-tight text-muted">Every plant checked before dispatch</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anchored Bottom Trust Strip */}
        <div className="relative z-10 w-full">
          <TrustStrip settings={settings} />
        </div>
      </section>

      {/* ALL PLANTS SECTION (Revealed as user scrolls down) */}
      <section id="plants-collection" className="container-shell scroll-mt-16 py-12 sm:py-16">
        <SectionHeading
          eyebrow="Our living collection"
          title="All Plants"
          description="Hand-nurtured botanical collection of indoor plants, exotic foliage, and succulents. Direct from nursery to your space."
          action={
            <Link href="/shop" className={buttonClasses({ variant: "secondary", size: "sm", className: "h-9 px-4 text-xs font-semibold" })}>
              View Full Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {allProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              wishlisted={wishlistIds.has(product.id)}
              loggedIn={loggedIn}
              priority={index < 2}
            />
          ))}
        </div>

        {/* Show More Plants Button */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/shop"
            className={buttonClasses({
              size: "lg",
              className: "h-11 rounded-xl px-8 text-sm font-semibold shadow-md shadow-forest-900/10 hover:shadow-lg transition-all",
            })}
          >
            Show More Plants <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* About Company Section */}
      <AboutCompanySection />

      {offer && (
        <section className="container-shell mt-12 sm:mt-16">
          <div className="relative overflow-hidden rounded-2xl bg-forest-900 text-white shadow-card">
            <div className="absolute inset-0 bg-grain opacity-20" aria-hidden />
            <div className="grid items-center gap-6 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="relative p-5 sm:p-8 lg:p-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-forest-100">
                  <Sparkles className="h-3 w-3" /> {offer.eyebrow ?? "New here?"}
                </span>
                <h2 className="display-title mt-3 max-w-md text-balance text-[24px] font-semibold leading-[1.1] sm:text-[32px]">
                  {offer.title}
                </h2>
                {offer.subtitle && (
                  <p className="mt-2.5 max-w-md text-pretty text-[12.5px] leading-relaxed text-white/65 sm:text-[13px]">
                    {offer.subtitle}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href={offer.cta_url ?? "/shop"} className={buttonClasses({ variant: "amber", size: "sm", className: "h-8.5 px-4 text-xs font-semibold" })}>
                    {offer.cta_label ?? "Shop Now"} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-[10.5px] text-white/50">Applied automatically at checkout</span>
                </div>
              </div>
              <div className="relative h-full min-h-[190px] sm:min-h-[240px]">
                <SafeImage
                  src={offer.image_url ?? "/images/plant-placeholder.svg"}
                  alt=""
                  sizes="(max-width: 640px) 100vw, 500px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-forest-900 via-forest-900/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="container-shell mt-10 sm:mt-12">
          <SectionHeading
            eyebrow="Community favorites"
            title="Best Sellers"
            description="Our most loved, resilient greenery trusted by thousands of plant parents."
            action={
              <Link href="/shop?sort=rating" className={buttonClasses({ variant: "secondary", size: "sm", className: "h-8 px-3 text-xs" })}>
                Explore All <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={false}
                loggedIn={false}
              />
            ))}
          </div>
        </section>
      )}

      <div className="container-shell mb-12 mt-12">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-leaf-mint p-4 sm:p-5.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-forest-700 shadow-sm">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-forest-950">Not sure which plant fits your space or project?</p>
              <p className="text-[11.5px] text-muted">Send us a photo of your area — our botanical specialists will guide you.</p>
            </div>
          </div>
          <Link href="/contact" className={buttonClasses({ variant: "secondary", size: "sm", className: "h-8.5 px-3.5 text-xs" })}>
            Ask a plant doctor <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

