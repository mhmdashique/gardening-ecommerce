import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/policies/shipping"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/policies/returns"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/policies/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/policies/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((product) => product.is_active)
    .map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: product.created_at ? new Date(product.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
