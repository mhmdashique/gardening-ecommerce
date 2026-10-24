import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin-forms";

export const metadata: Metadata = { title: "New product", robots: { index: false, follow: false } };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  const categories = await getCategories(true);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/products" className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Products
        </Link>
        <h1 className="mt-1 font-display text-[22px] font-semibold text-forest-950 sm:text-[26px]">Add a product</h1>
        <p className="mt-0.5 text-[11.5px] text-muted">Create the plant, then add one or more saleable sizes.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
