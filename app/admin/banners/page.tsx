import type { Metadata } from "next";
import { CheckCircle2, Image as ImageIcon, LayoutGrid, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAllBanners } from "@/lib/catalog";
import { BannerManager } from "@/components/admin-forms";

export const metadata: Metadata = { title: "Storefront Banners & Campaigns | Admin", robots: { index: false, follow: false } };

const placements = [
  { key: "hero", label: "Hero Main Carousel", desc: "Top of homepage above fold" },
  { key: "offer", label: "Homepage Featured Offer", desc: "Mid-page marketing banner" },
  { key: "special_offer", label: "Logged-in VIP Offer", desc: "Visible exclusively to logged in patrons" },
  { key: "dashboard_promo", label: "Customer Dashboard Promo", desc: "Shows on user portal overview" },
] as const;

export default async function AdminBannersPage() {
  await requireAdmin("/admin/banners");
  const banners = await getAllBanners();
  const live = banners.filter((banner) => banner.is_active);
  const byPlacement = (placement: string) => banners.filter((banner) => banner.placement === placement).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Marketing Banners &amp; Promos</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {banners.length} Campaigns
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Configure storefront hero carousels, seasonal discount banners, and personalized customer promos.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Campaigns</span>
            <ImageIcon className="h-4 w-4 text-forest-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">{banners.length}</p>
          <p className="mt-1 text-[11px] text-muted">Across all positions</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live On Store</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-950">{live.length}</p>
          <p className="mt-1 text-[11px] text-emerald-700">Currently broadcasting</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hero Carousel Slides</span>
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-blue-950">{byPlacement("hero")}</p>
          <p className="mt-1 text-[11px] text-blue-700">Rotating top slides</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mid-Page Offers</span>
            <LayoutGrid className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-950">
            {byPlacement("offer") + byPlacement("special_offer")}
          </p>
          <p className="mt-1 text-[11px] text-amber-700">Store and patron banners</p>
        </div>
      </div>

      {/* Banner Manager */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <BannerManager banners={banners} />
      </section>

      {/* Placement Guide Section */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-display text-base font-bold text-forest-950">Storefront Placement Map</h2>
        <p className="text-xs text-muted mb-4">How banners and media distribute across the customer journey</p>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {placements.map((placement) => (
            <div key={placement.key} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-subtle/50 p-3.5">
              <div>
                <p className="text-xs font-bold text-forest-950">{placement.label}</p>
                <p className="text-[10.5px] text-muted">{placement.desc}</p>
              </div>
              <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-bold text-forest-900">
                {byPlacement(placement.key)} live
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

