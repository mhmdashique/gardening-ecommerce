"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[leaf-and-pot] page error", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-leaf-mint/50 px-4 py-16 text-center">
      <Brand />
      <div className="mt-9 grid h-14 w-14 place-items-center rounded-2xl bg-white text-amber-ink shadow-soft">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-forest-600">Something went wrong</p>
      <h1 className="display-title mt-2 max-w-xl text-balance text-[30px] font-semibold text-forest-950 sm:text-[38px]">
        This page wilted for a moment.
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        Your cart is safe. Try again, and if it keeps happening, contact us with the reference
        {error.digest ? <span className="font-mono text-[11px] text-forest-800"> {error.digest}</span> : null}.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClasses()}>
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/shop" className={buttonClasses({ variant: "secondary" })}>
          Continue shopping
        </Link>
        <Link href="/contact" className={buttonClasses({ variant: "ghost" })}>
          Contact support
        </Link>
      </div>
    </main>
  );
}
