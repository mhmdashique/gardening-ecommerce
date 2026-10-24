import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategories, getProductById } from "@/lib/catalog";
import { ProductForm } from "@/components/admin-forms";

export const metadata: Metadata = { title: "Edit product", robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/products");
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductById(id), getCategories(true)]);
  if (!product) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Products
          </Link>
          <h1 className="mt-1 font-display text-[22px] font-semibold text-forest-950 sm:text-[26px]">{product.name}</h1>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {product.variants.length} size(s) · {product.is_active ? "Live in store" : "Hidden"}
          </p>
        </div>
        <Link href={`/product/${product.slug}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline">
          View in store <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
