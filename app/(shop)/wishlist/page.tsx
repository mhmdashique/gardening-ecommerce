import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistProducts } from "@/lib/catalog";
import { WishlistGrid } from "@/components/wishlist-grid";
import { EmptyState, buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "Plants you've saved for later.",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();

  return (
    <div className="container-shell py-7 sm:py-9">
      <div className="mb-6">
        <p className="eyebrow mb-1">Saved for later</p>
        <h1 className="display-title text-[28px] font-semibold text-forest-950 sm:text-[34px]">Your Wishlist</h1>
        <p className="mt-1.5 text-[13px] text-muted">The plants you keep coming back to.</p>
      </div>

      {!user ? (
        <EmptyState
          icon={Heart}
          title="Log in to see your wishlist"
          description="Your saved plants live in your Leaf & Pot account, waiting for you."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/login?next=/wishlist" className={buttonClasses()}>
                Log in
              </Link>
              <Link href="/register?next=/wishlist" className={buttonClasses({ variant: "secondary" })}>
                Create account
              </Link>
            </div>
          }
        />
      ) : (
        <WishlistGrid products={await getWishlistProducts(user.id)} />
      )}
    </div>
  );
}
