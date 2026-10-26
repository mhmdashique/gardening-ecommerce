import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getReviewsForUser } from "@/lib/catalog";
import { MyReviewsList } from "@/components/my-reviews";

export const metadata: Metadata = { title: "My Reviews", robots: { index: false, follow: false } };

export default async function AccountReviewsPage() {
  const user = await requireUser("/account/reviews");
  const reviews = await getReviewsForUser(user.id);

  return (
    <div className="space-y-5">
      {/* Phone header: back row (reference: lands straight on the reviews) */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account"
          aria-label="Back to My account"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest-800 shadow-sm transition hover:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="font-display text-[19px] font-semibold text-forest-950">My Reviews</h1>
      </div>

      <div className="hidden sm:block">
        <p className="eyebrow mb-1">Your voice</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">My Reviews</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Edit, update or delete the reviews you've written for your plants.</p>
      </div>

      <MyReviewsList reviews={reviews} />

      <p className="text-[10.5px] leading-relaxed text-muted">
        Reviews appear on product pages once approved. If you edit a review, it goes back to our team for a quick
        check before publishing again.
      </p>
    </div>
  );
}
