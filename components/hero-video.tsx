"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";

const VIDEO_URL = "https://assets.mixkit.co/videos/4776/4776-720.mp4";

export function WatchVideoButton({ poster }: { poster?: string | null }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2.5 text-[12.5px] font-semibold text-forest-900 transition hover:text-forest-700"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-800 text-white shadow-soft transition group-hover:bg-forest-900">
          <Play className="ml-0.5 h-3 w-3 fill-current" aria-hidden />
        </span>
        <span className="underline-offset-4 group-hover:underline">Watch Video</span>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto p-4 sm:p-6">
            <button
              type="button"
              className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm animate-fade-in"
              onClick={() => setOpen(false)}
              aria-label="Close video"
              tabIndex={-1}
            />
            <div
              className="relative z-10 w-full max-w-3xl animate-fade-up"
              role="dialog"
              aria-modal="true"
              aria-label="Leaf & Pot brand video"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-forest-950 shadow-lift">
                <video
                  src={VIDEO_URL}
                  poster={poster ?? undefined}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full"
                />
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-forest-900 shadow-card transition hover:bg-leaf-mint sm:-right-3 sm:-top-3"
                aria-label="Close video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
