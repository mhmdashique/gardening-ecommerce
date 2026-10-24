import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, MessageSquare, Sparkles, Star, ThumbsUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminReviews } from "@/lib/catalog";
import { ReviewActions } from "@/components/admin-forms";
import { Badge, EmptyState, buttonClasses } from "@/components/ui";
import { Stars } from "@/components/stars";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Customer Reviews & Moderation | Admin", robots: { index: false, follow: false } };

const filters = [
  { key: "all", label: "All Reviews" },
  { key: "pending", label: "Awaiting Moderation" },
  { key: "approved", label: "Published on Store" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/reviews");
  const params = await searchParams;
  const raw = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const filter = filters.some((item) => item.key === raw) ? (raw as (typeof filters)[number]["key"]) : "all";

  const reviews = await getAdminReviews();
  const pending = reviews.filter((review) => !review.is_approved).length;
  const approved = reviews.filter((review) => review.is_approved).length;
  const average = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const filtered = reviews.filter((review) =>
    filter === "pending" ? !review.is_approved : filter === "approved" ? review.is_approved : true,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Customer Reviews</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {reviews.length} Feedbacks
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Moderate botanical testimonials, approve customer ratings, and verify plant feedback.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Submissions</span>
            <MessageSquare className="h-4 w-4 text-forest-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">{reviews.length}</p>
          <p className="mt-1 text-[11px] text-muted">All customer comments</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Needs Moderation</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-950">{pending}</p>
          <p className="mt-1 text-[11px] text-amber-700">Awaiting approval</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Published Live</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-950">{approved}</p>
          <p className="mt-1 text-[11px] text-emerald-700">Displaying on product pages</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Rating</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">{average || "5.0"} / 5.0</p>
          <p className="mt-1 text-[11px] text-muted">Overall satisfaction</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((item) => {
          const count =
            item.key === "pending" ? pending : item.key === "approved" ? approved : reviews.length;
          return (
            <Link
              key={item.key}
              href={item.key === "all" ? "/admin/reviews" : `/admin/reviews?filter=${item.key}`}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                filter === item.key
                  ? "border-emerald-700 bg-gradient-to-r from-emerald-800 to-forest-900 text-white shadow-sm"
                  : "border-line bg-white text-forest-800 hover:border-emerald-300 hover:bg-emerald-50/50",
              )}
            >
              {item.label} · {count}
            </Link>
          );
        })}
      </div>

      {/* Review List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews in this queue"
          description="Customer reviews appear once an order is delivered. Approve them to display them on plant pages."
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((review) => (
            <article key={review.id} className="rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        review.is_approved
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${review.is_approved ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {review.is_approved ? "Published on storefront" : "Pending moderation"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-forest-950">
                    {review.product_name ?? "Botanical Plant"} · <span className="font-normal text-muted">{review.customer_name}</span>
                  </p>
                  <p className="text-[10px] text-muted">{formatDate(review.created_at)}</p>
                </div>
                <ReviewActions review={review} />
              </div>

              <p className="mt-3 rounded-2xl bg-surface-subtle/70 border border-line/60 p-3.5 text-xs leading-relaxed text-forest-900">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <Link
                  href={`/admin/products/${review.product_id}`}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                >
                  View plant catalog entry &rarr;
                </Link>
                {review.order_id && (
                  <Link href={`/admin/orders/${review.order_id}`} className="font-semibold text-forest-700 hover:underline">
                    Inspect original order
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

