import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, RotateCcw, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminReturns, getSettings } from "@/lib/catalog";
import { ReturnReviewForm } from "@/components/admin-forms";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Returns & Replacements | Admin", robots: { index: false, follow: false } };

export default async function AdminReturnsPage() {
  await requireAdmin("/admin/returns");
  const [returns, settings] = await Promise.all([getAdminReturns(), getSettings()]);
  const open = returns.filter((request) => request.status === "requested");
  const approved = returns.filter((request) => request.status === "approved" || request.status === "refunded");

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Returns &amp; Replacements</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {returns.length} Requests
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Inspect customer return requests, review plant transit condition photos, and issue refunds or replacements.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Claims</span>
            <RotateCcw className="h-4 w-4 text-forest-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">{returns.length}</p>
          <p className="mt-1 text-[11px] text-muted">All customer returns</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Decision</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-950">{open.length}</p>
          <p className="mt-1 text-[11px] text-amber-700">Pending review</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Resolved / Refunded</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-950">{approved.length}</p>
          <p className="mt-1 text-[11px] text-emerald-700">Approved claims</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Return Window</span>
            <Sparkles className="h-4 w-4 text-forest-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-forest-950">{settings.return_window_days} Days</p>
          <p className="mt-1 text-[11px] text-muted">Storefront policy window</p>
        </div>
      </div>

      {returns.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No return requests"
          description="When a customer reports an issue or damaged transit plant, it will appear here for review."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {returns.map((request) => (
            <article key={request.id} className="rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Order #{request.order_number ?? "N/A"} · {formatDate(request.created_at)}
                  </p>
                  <h2 className="mt-1 font-display text-base font-bold text-forest-950">{request.product_name}</h2>
                  <p className="text-xs text-muted">{request.customer_name}</p>
                </div>
                <Badge
                  tone={
                    request.status === "approved" || request.status === "refunded"
                      ? "green"
                      : request.status === "rejected"
                        ? "red"
                        : "amber"
                  }
                >
                  {request.status}
                </Badge>
              </div>

              <div className="mt-3 rounded-2xl bg-surface-subtle/70 border border-line/60 p-3.5 text-xs leading-relaxed text-forest-900">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Customer Reason</p>
                &ldquo;{request.reason}&rdquo;
              </div>

              {request.photo_urls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {request.photo_urls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-subtle px-2.5 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-emerald-50 transition"
                    >
                      Inspect Photo {i + 1} ↗
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-line pt-3.5">
                <ReturnReviewForm request={request} />
              </div>

              {request.order_id && (
                <Link
                  href={`/admin/orders/${request.order_id}`}
                  className="mt-3 inline-block text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  Inspect complete order details &rarr;
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

