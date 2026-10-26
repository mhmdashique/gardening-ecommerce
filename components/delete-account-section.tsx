"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/lib/actions/account";
import { useToast } from "@/components/toast";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Delete account (phone-only on the Settings page) — a collapsed danger row;
 * tapping it drops down the warning, a type-DELETE confirmation box and the
 * final "Delete account" button (same server action as the desktop danger zone).
 */
export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const submit = () => {
    startTransition(async () => {
      try {
        await deleteAccountAction();
      } catch (error) {
        // Successful deletions navigate via redirect(); only surface real errors.
        const digest =
          error && typeof error === "object" ? String((error as { digest?: unknown }).digest ?? "") : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        toast(error instanceof Error ? error.message : "Could not delete your account. Contact support.", "error");
      }
    });
  };

  const confirmed = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <div className="sm:hidden">
      <div className="overflow-hidden rounded-2xl border border-danger/25 bg-white shadow-card">
        <button
          type="button"
          onClick={() => {
            if (!open) setConfirmText("");
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-danger-soft/60"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
            <ShieldAlert className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-forest-950">Delete Account</span>
            <span className="block text-[10.5px] text-muted">Permanently remove all your data</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="border-t border-danger/15 bg-danger-soft/70 px-3.5 py-3">
            <p className="text-[11px] leading-relaxed text-danger-ink">
              Deleting your account removes all orders, addresses, wishlist, reviews and reward points. This cannot
              be undone.
            </p>
            <label className="mt-2 block text-[10px] text-danger-ink/85" htmlFor="delete-account-confirm">
              Type DELETE to confirm
            </label>
            <Input
              id="delete-account-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="mt-1"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!confirmed || pending}
              className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-danger px-3 text-[11.5px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {pending ? "Deleting your account…" : "Delete account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
