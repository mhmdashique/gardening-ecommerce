import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
import { minPrice } from "@/lib/product-utils";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });
  const { products } = await getProducts({ q: query, perPage: 6 });
  return NextResponse.json({
    results: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: minPrice(product),
      image: product.images[0] ?? "/images/plant-placeholder.svg",
      category: product.category_name,
    })),
  });
}
