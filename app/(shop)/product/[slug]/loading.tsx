export default function ProductLoading() {
  return (
    <div className="container-shell py-6 sm:py-8 lg:py-10 space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="h-[400px] rounded-3xl border border-line bg-line/30 animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-1/2 rounded-full bg-line animate-pulse" />
          <div className="h-10 w-3/4 rounded-full bg-line animate-pulse" />
          <div className="h-12 max-w-md rounded-full bg-line/50 animate-pulse" />
          <div className="h-6 w-full rounded-full bg-line/50 animate-pulse" />
          <div className="h-40 bg-line/30 rounded-2xl animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-full bg-line animate-pulse" />
            <div className="h-10 w-32 rounded-full bg-line/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
