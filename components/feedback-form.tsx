"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BadgeCheck, Loader2, Sparkles, Sprout, Star, X } from "lucide-react";
import { Modal } from "@/components/interactive";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/actions/account";

/**
 * Post-order website feedback. After the order confirmation is shown, a modal
 * opens with the two-question review (star rating + improvements note); a
 * compact card lets the customer open it again later. Submitting swaps the
 * view for a thank-you greeting from the team.
 */
export function OrderFeedback({
  firstName,
  orderId,
  submitAction,
  alreadySubmitted = false,
}: {
  firstName: string;
  orderId?: string;
  submitAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  alreadySubmitted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [improvements, setImprovements] = useState("");
  const [autoAllowed, setAutoAllowed] = useState(false);

  const thanks = state.success;
  const settled = alreadySubmitted || Boolean(thanks);
  const seenKey = `leaf-feedback-seen-${orderId ?? "latest"}`;

  // Auto-open once per order per tab, shortly after the confirmation lands.
  useEffect(() => {
    try {
      setAutoAllowed(window.sessionStorage.getItem(seenKey) !== "1");
    } catch {
      setAutoAllowed(true);
    }
  }, [seenKey]);

  useEffect(() => {
    if (!autoAllowed || alreadySubmitted || thanks) return;
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [autoAllowed, alreadySubmitted, thanks]);

  const closeModal = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(seenKey, "1");
    } catch {
      /* storage may be unavailable */
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const formData = new FormData();
    if (orderId) formData.set("order_id", orderId);
    formData.set("rating", String(rating));
    formData.set("improvements", improvements);
    void submitAction({}, formData)
      .then((result) => setState(result))
      .finally(() => setPending(false));
  };

  return (
    <>
      {/* Compact on-page status — hidden from view after the greeting. */}
      <section className="card mt-5 p-5 text-center sm:p-6">
        {settled ? (
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success-soft text-success-ink">
              <BadgeCheck className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-[13px] font-medium text-forest-900">
              {firstName}, thanks for sharing your feedback with us — a greeting is on its way 🌿
            </p>
          </div>
        ) : (
          <>
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-leaf-soft text-forest-700">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-display text-[17px] font-semibold text-forest-950 sm:text-[19px]">
              {firstName}, got two minutes to tell us how we did?
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted">
              Rate the website and share any improvements — it takes 30 seconds while your order gets packed.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-forest-800 px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-forest-900 active:bg-forest-950"
            >
              <Sparkles className="h-4 w-4" /> Share your feedback
            </button>
          </>
        )}
      </section>

      {/* Review modal */}
      <Modal
        open={open}
        onClose={closeModal}
        size="sm"
        title={settled ? "Thank you from Leaf & Pot" : "Share your feedback"}
        description={settled ? undefined : "Two quick questions while your plants get packed."}
      >
        {thanks || alreadySubmitted ? (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-leaf-soft text-forest-700">
              <Sprout className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-forest-950">
              A greeting from all of us at Leaf &amp; Pot 🌿
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
              {thanks ?? `Thank you, ${firstName}! Your feedback is safe with our small team and helps the shop (and the plants) grow.`}
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-forest-800 px-5 text-[13px] font-semibold text-white transition hover:bg-forest-900"
            >
              <X className="h-4 w-4 -ml-1 mr-1.5" /> Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {state.error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-[11.5px] font-medium text-danger-ink" role="alert">
                {state.error}
              </p>
            )}

            {/* 1. Website feedback — 5 stars */}
            <div className="rounded-xl border border-line bg-leaf-mint/40 p-4 text-center">
              <p className="text-[13px] font-semibold text-forest-900">
                1. What is your feedback about the website?
              </p>
              <div className="mt-2 flex items-center justify-center gap-1" role="radiogroup" aria-label="Website rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    className="rounded-md p-1 transition hover:scale-110"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition",
                        (hover || rating) >= value ? "fill-amber text-amber" : "text-forest-200",
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                {rating === 5 ? "Five stars — amazing!" : `${rating} star${rating > 1 ? "s" : ""}`}
              </p>
            </div>

            {/* 2. Improvements — comment box */}
            <div>
              <label htmlFor="feedback-improvements" className="label-base">
                2. Any improvements you would like to see?
              </label>
              <textarea
                id="feedback-improvements"
                value={improvements}
                onChange={(event) => setImprovements(event.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Something that felt slow, confusing or missing? Even one line helps."
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink shadow-sm outline-none transition placeholder:text-muted/70 focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 font-semibold text-white shadow-sm transition duration-200 hover:bg-forest-900 active:bg-forest-950 disabled:pointer-events-none disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send feedback
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
