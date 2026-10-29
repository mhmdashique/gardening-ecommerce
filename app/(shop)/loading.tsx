export default function HomeLoading() {
  return (
    <div className="space-y-8">
      <section className="min-h-[70vh] flex flex-col items-center justify-center bg-[#faf9f5]">
        <div className="h-4 w-32 rounded-full bg-line animate-pulse" />
        <div className="mt-4 h-4 w-24 rounded-full bg-line/50 animate-pulse" />
        <div className="mt-4 flex gap-3">
          <a className="h-10 w-28 rounded-full bg-line animate-pulse" />
          <a className="h-10 w-32 rounded-full bg-line/50 animate-pulse" />
        </div>
      </section>

      <section className="py-12">
        <div className="space-y-4">
          <div className="h-4 w-1/3 rounded-full bg-line animate-pulse" />
          <div className="h-24 w-full rounded-xl bg-line animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-line bg-line/30 animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}
