import { Leaf } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-start pt-24"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-8">
        <Leaf className="h-4 w-4 animate-pulse text-forest-500" /> Loading
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-full animate-shimmer rounded-xl bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
        <div className="h-6 w-3/4 animate-shimmer rounded-xl bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-line bg-white">
              <div className="h-12 w-12 shrink-0 animate-shimmer rounded-xl bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-shimmer rounded-lg bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
                <div className="h-3 w-1/2 animate-shimmer rounded-lg bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-line bg-white overflow-hidden">
              <div className="h-16 animate-shimmer w-full bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-4/5 animate-shimmer rounded bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
                <div className="h-3 w-1/3 animate-shimmer rounded bg-[linear-gradient(90deg,#eef4ef_25%,#f7fbf8_37%,#eef4ef_63%)] bg-[length:400%_100%]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading page content…</span>
    </div>
  );
}
