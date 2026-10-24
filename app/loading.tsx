import { Leaf } from "lucide-react";

export default function Loading() {
  return (
    <div className="container-shell py-10" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        <Leaf className="h-4 w-4 animate-pulse text-forest-500" /> Loading
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden space-y-2 lg:block">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="h-9 animate-pulse rounded-xl bg-forest-50" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-forest-50" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-forest-50" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="card overflow-hidden">
                <div className="aspect-square animate-pulse bg-forest-50" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-forest-50" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-forest-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading page content…</span>
    </div>
  );
}
