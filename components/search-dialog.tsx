"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
}

export function SearchDialog({
  open,
  onClose,
  initialQuery = "",
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setResults([]);
      setLoaded(false);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setLoaded(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = (await response.json()) as { results: SearchResult[] };
          setResults(data.results ?? []);
          setLoaded(true);
        }
      } catch {
        /* aborted or offline */
      } finally {
        setLoading(false);
      }
    }, 260);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="fixed inset-0 z-[108]">
      <button
        type="button"
        className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Close search"
        tabIndex={-1}
      />
      <div className="relative mx-auto mt-[8vh] w-[calc(100%-2rem)] max-w-2xl animate-fade-up" role="dialog" aria-modal="true" aria-label="Search products">
        <form onSubmit={submit} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-lift">
          <Search className="ml-1 h-5 w-5 shrink-0 text-forest-600" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for plants, pots, or categories…"
            className="h-10 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/70"
            aria-label="Search products"
            autoComplete="off"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-leaf-mint"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="hidden h-10 rounded-xl bg-forest-800 px-4 text-sm font-semibold text-white sm:block">
            Search
          </button>
        </form>

        {query.trim().length >= 2 && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            {results.length > 0 ? (
              <>
                <ul className="max-h-[50vh] overflow-y-auto p-2">
                  {results.map((result) => (
                    <li key={result.id}>
                      <Link
                        href={`/product/${result.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-leaf-mint"
                      >
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                          <Image
                            src={result.image}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-forest-950">{result.name}</span>
                          <span className="block text-[11px] text-muted">{result.category}</span>
                        </span>
                        <span className="text-sm font-semibold text-forest-900">{formatINR(result.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={submit}
                  className="flex w-full items-center justify-between border-t border-line bg-leaf-mint/50 px-4 py-3 text-sm font-semibold text-forest-800 hover:bg-leaf-mint"
                >
                  See all results for “{query.trim()}”
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : loaded && !loading ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold text-forest-900">No matches yet</p>
                <p className="mt-1 text-xs text-muted">Try “monstera”, “succulent” or “terracotta”.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
