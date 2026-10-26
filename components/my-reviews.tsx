"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Pencil, Star, Trash2 } from "lucide-react";
import { Badge, Button, Field, Textarea } from "@/components/ui";
import { Modal } from "@/components/interactive";
import { useToast } from "@/components/toast";
import { deleteReviewAction, updateReviewAction, type FormState } from "@/lib/actions/account";
import type { Review } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("h-3.5 w-3.5", n <= rating ? "fill-amber text-amber" : "text-forest-200")} />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDeleteTransition] = useTransition();
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateReviewAction, {});
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  const handleDelete = () => {
    const data = new FormData();
    data.set("review_id", review.id);
    startDeleteTransition(async () => {
      const res = await deleteReviewAction({}, data);
      setDeleteOpen(false);
      toast(res.error ? res.error : res.success || "Your review was removed.", res.error ? "error" : "success");
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-forest-950">{review.product_name ?? "Product review"}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">{formatDate(review.created_at)}</p>
        </div>
        <Badge tone={review.is_approved ? "green" : "amber"}>
          {review.is_approved ? "Published" : "Awaiting approval"}
        </Badge>
      </div>

      {editing ? (
        <form action={formAction} className="mt-3 space-y-3.5">
          <input type="hidden" name="review_id" value={review.id} />
          <input type="hidden" name="rating" value={review.rating} />
          <Field label="Your comment" htmlFor={`review-comment-${review.id}`} error={state.fieldErrors?.comment}>
            <Textarea id={`review-comment-${review.id}`} name="comment" defaultValue={review.comment} maxLength={800} required />
          </Field>
          {state.error && <p className="text-[11.5px] font-medium text-danger">{state.error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Update review
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-2.5 flex items-center gap-2">
            <Stars rating={review.rating} />
            <span className="text-[10.5px] font-semibold text-muted">{review.rating}/5</span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-forest-900">{review.comment}</p>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-[11.5px] font-semibold text-forest-800 transition hover:bg-leaf-mint"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-danger/25 px-3 text-[11.5px] font-semibold text-danger-ink transition hover:bg-danger/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this review?"
        description="This permanently removes your review."
      >
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={deleting} onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-danger px-4 text-[12.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete review
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function MyReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-4 py-8 text-center shadow-card">
        <MessageSquare className="mx-auto h-6 w-6 text-forest-300" />
        <p className="mt-2 text-[12.5px] font-semibold text-forest-950">No reviews yet</p>
        <p className="mx-auto mt-1 max-w-[240px] text-[11px] text-muted">
          Rate &amp; review your plants once an order is delivered — they show up here.
        </p>
        <Link
          href="/account/orders"
          className="mt-3 inline-flex h-9 items-center rounded-xl bg-forest-900 px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          Go to my orders
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
