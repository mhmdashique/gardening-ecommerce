"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

/**
 * Language preference (phone-only on the Settings page) — a single dropdown row:
 * tapping "Language" expands the list of languages to pick from. The storefront
 * UI currently renders in English everywhere; the chosen language is stored on
 * this device until multi-language translations ship.
 */

const LANGUAGES = [
  { code: "en", label: "English" },
];

const STORAGE_KEY = "leafpot.language";

export function LanguagePicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("en");
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES.some((l) => l.code === stored)) setSelected(stored);
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, []);

  const pick = (code: string) => {
    setSelected(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
      const label = LANGUAGES.find((l) => l.code === code)?.label ?? "English";
      toast(`Language set to ${label}. Saved on this device.`, "success");
    } catch {
      toast("Could not save your language preference on this device.", "error");
    }
  };

  const current = LANGUAGES.find((l) => l.code === selected)?.label ?? "English";

  return (
    <div className="sm:hidden">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-leaf-mint/40"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-leaf-mint text-forest-700">
            <Globe className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-forest-950">Language</span>
          </span>
          <span className="shrink-0 text-[12px] font-semibold text-forest-900">{current}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="border-t border-line bg-forest-50/40 px-1 py-1">
            {LANGUAGES.map((lang) => {
              const active = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => pick(lang.code)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-medium text-forest-900 transition",
                    active ? "bg-leaf-mint font-semibold text-forest-800" : "hover:bg-leaf-mint/50",
                  )}
                >
                  {lang.label}
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-forest-700" strokeWidth={2.4} />}
                </button>
              );
            })}
            <p className="px-3 pb-2 pt-1.5 text-[9.5px] leading-relaxed text-muted">
              Saved on this device. The store currently shows English — regional translations are coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
