"use client";

import { useEffect, useId, useRef } from "react";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  max = 20,
  min = 1,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const change = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-line bg-white",
        size === "sm" ? "h-8" : "h-10",
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => change(value - 1)}
        disabled={value <= min}
        className={cn(
          "grid place-items-center text-forest-800 transition hover:bg-leaf-mint disabled:opacity-35",
          size === "sm" ? "h-8 w-8" : "h-10 w-10",
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn("min-w-7 text-center font-semibold tabular-nums", size === "sm" ? "text-xs" : "text-sm")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => change(value + 1)}
        disabled={value >= max}
        className={cn(
          "grid place-items-center text-forest-800 transition hover:bg-leaf-mint disabled:opacity-35",
          size === "sm" ? "h-8 w-8" : "h-10 w-10",
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-forest-950/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift outline-none animate-fade-up sm:rounded-3xl sm:p-6",
          {
            "sm:max-w-md": size === "sm",
            "sm:max-w-xl": size === "md",
            "sm:max-w-3xl": size === "lg",
          },
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={id} className="font-display text-xl font-semibold text-forest-950">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-mint text-forest-800 hover:bg-forest-100"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
      }}
      className="rounded-md px-2 py-1 text-xs font-semibold text-forest-700 hover:bg-leaf-mint"
    >
      {label}
    </button>
  );
}
