import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Boxes, CheckCircle2, Eye, Filter, Plus, Search, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminProducts, getCategories } from "@/lib/catalog";
import { ProductRowActions } from "@/components/admin-forms";
import { SafeImage } from "@/components/safe-image";
import { Badge, buttonClasses } from "@/components/ui";
import { minPrice, totalStock } from "@/lib/product-utils";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Botanical Inventory & Catalog | Admin", robots: { index: false, follow: false } };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/products");
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.toLowerCase().trim() ?? "";
  const status = (Array.isArray(params.status) ? params.status[0] : params.status) ?? "all";
  const category = (Array.isArray(params.category) ? params.category[0] : params.category) ?? "all";

  const [products, categories] = await Promise.all([getAdminProducts(), getCategories(true)]);
  
  const liveCount = products.filter((p) => p.is_active).length;
  const lowStockCount = products.filter((p) => p.variants.some((v) => v.stock <= v.low_stock_threshold)).length;
  const draftCount = products.length - liveCount;

  const filtered = products.filter((product) => {
    if (q && !`${product.name} ${product.slug} ${product.category_name}`.toLowerCase().includes(q)) return false;
    if (status === "active" && !product.is_active) return false;
    if (status === "inactive" && product.is_active) return false;
    if (status === "low" && !product.variants.some((variant) => variant.stock <= variant.low_stock_threshold)) return false;
    if (category !== "all" && product.category_id !== category) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header with KPI cards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Botanical Inventory</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {products.length} Items
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Manage greenhouse plants, variant stock levels, botanic pricing, and visibility.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/20 transition hover:from-emerald-500 hover:to-teal-500 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Link>
      </div>

      {/* Quick stats pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Catalog</p>
          <p className="mt-1 font-display text-xl font-bold text-forest-950">{products.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active &amp; Live</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-900">{liveCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Low / Out of Stock</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-900">{lowStockCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface-subtle p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Draft / Hidden</p>
          <p className="mt-1 font-display text-xl font-bold text-forest-800">{draftCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm" method="get">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search products</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search plant name, slug or category..."
            className="input-base h-11 pl-10 text-xs"
          />
        </label>
        
        <select name="category" defaultValue={category} className="input-base h-11 w-auto min-w-[160px] text-xs">
          <option value="all">All Categories</option>
          {categories.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name}</option>
          ))}
        </select>

        <select name="status" defaultValue={status} className="input-base h-11 w-auto min-w-[140px] text-xs">
          <option value="all">All Statuses</option>
          <option value="active">Live</option>
          <option value="inactive">Draft / Hidden</option>
          <option value="low">Low Stock Only</option>
        </select>

        <button
          type="submit"
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          <Filter className="h-3.5 w-3.5" /> Apply Filters
        </button>

        {(q || status !== "all" || category !== "all") && (
          <Link
            href="/admin/products"
            className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-forest-700 hover:bg-leaf-mint"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Product Table */}
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-subtle/40 text-[10px] uppercase tracking-wider text-muted font-bold">
                <th className="px-5 py-3.5">Botanical Plant</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price Range</th>
                <th className="px-5 py-3.5">Inventory</th>
                <th className="px-5 py-3.5">Variants</th>
                <th className="px-5 py-3.5">Visibility</th>
                <th className="px-5 py-3.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((product) => {
                const stock = totalStock(product);
                return (
                  <tr key={product.id} className="transition hover:bg-emerald-50/20">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-emerald-50 shadow-sm">
                          <SafeImage src={product.images[0] ?? "/images/plant-placeholder.svg"} alt="" sizes="48px" className="object-cover" />
                        </span>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="font-bold text-forest-950 hover:underline">
                            {product.name}
                          </Link>
                          <p className="text-[10px] text-muted truncate max-w-xs">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-forest-50 px-2.5 py-1 text-[11px] font-medium text-forest-900 border border-forest-100">
                        {product.category_name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-forest-950">{formatINR(minPrice(product))}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                          stock === 0
                            ? "bg-red-100 text-red-700"
                            : stock <= 5
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {stock === 0 ? "Out of Stock" : `${stock} in stock`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((v) => (
                          <span key={v.id} className="rounded-md border border-line bg-surface-subtle px-1.5 py-0.5 text-[9.5px]">
                            {v.size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {product.is_active ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ProductRowActions product={product} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <Boxes className="mx-auto mb-2 h-7 w-7 text-forest-400" />
                    <p className="font-semibold text-forest-950">No products found</p>
                    <p className="text-xs">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

