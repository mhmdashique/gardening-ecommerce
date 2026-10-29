export default function AccountLoading() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:hidden">
        <div className="h-10 w-10 rounded-full bg-line animate-pulse" />
        <div>
          <div className="h-4 w-1/3 rounded-full bg-line animate-pulse" />
          <div className="mt-1 h-3 w-1/2 rounded-full bg-line/50 animate-pulse" />
        </div>
      </div>

      <div className="hidden sm:block">
        <div>
          <div className="h-6 w-1/3 rounded-full bg-line animate-pulse" />
          <div className="mt-1 h-3 w-1/2 rounded-full bg-line/50 animate-pulse" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden rounded-2xl border border-line">
          <div className="h-10 w-full border-b border-line px-4 py-3 sm:px-5 bg-line/30 animate-pulse" />
          <ul className="divide-y divide-line space-y-0">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="h-8 w-24 rounded-full bg-line animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 rounded-full bg-line animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-line/50 animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden rounded-2xl border border-line">
          <div className="h-10 w-full border-b border-line px-4 py-3 sm:px-5 bg-line/30 animate-pulse" />
          <ul className="divide-y divide-line space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="h-8 w-20 rounded-full bg-line animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-2/3 rounded-full bg-line animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-line/50 animate-pulse" />
                </div>
                <div className="h-8 w-16 rounded-full bg-line animate-pulse" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-line/30 p-4 sm:p-5 shadow-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
