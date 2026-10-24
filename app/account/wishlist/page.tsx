import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getWishlistProducts } from "@/lib/catalog";
import { WishlistGrid } from "@/components/wishlist-grid";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };

export default async function AccountWishlistPage() {
  const user = await requireUser("/account/wishlist");
  const products = await getWishlistProducts(user.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">{products.length} saved plant{products.length === 1 ? "" : "s"}</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Wishlist</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">The plants you keep coming back to. They&apos;re saved for later.</p>
      </div>
      <WishlistGrid products={products} />
    </div>
  );
}
