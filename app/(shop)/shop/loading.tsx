import Link from "next/link";

export default function ShopLoading() {
  return (
    <div className="container-shell py-6 sm:py-8 lg:py-10 space-y-8">
      <nav className="mb-5 flex items-center gap-1.5 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest-800">Home</Link>
        <span className="h-3 w-3 rounded-full bg-line animate-pulse" />
        <span className="text-forest-900">Shop</span>
      </nav>

      <div className="mb-7 flex flex-col gap-2 sm:mb-8">
        <div className="h-4 w-1/4 rounded-full bg-line animate-pulse" />
        <div className="h-10 w-1/2 rounded-full bg-line animate-pulse" />
        <div className="h-6 max-w-2xl rounded-full bg-line/50 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="h-80 rounded-2xl border border-line bg-line/30 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
