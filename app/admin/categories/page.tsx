import type { Metadata } from "next";
import {} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { CategoryManager } from "@/components/admin-forms";

export const metadata: Metadata = { title: "Botanical Categories | Admin", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");
  const categories = await getCategories(true);
  const liveCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Botanical Categories</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {categories.length} Taxonomies
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Organize greenhouse plant collections, indoor &amp; outdoor flora sections, and homepage collections.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Categories</p>
          <p className="mt-1 font-display text-xl font-bold text-forest-950">{categories.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active &amp; Visible</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-900">{liveCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface-subtle p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Draft / Hidden</p>
          <p className="mt-1 font-display text-xl font-bold text-forest-800">{categories.length - liveCount}</p>
        </div>
      </div>

      {/* Category Manager Container */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <CategoryManager categories={categories} />
      </section>
    </div>
  );
}

