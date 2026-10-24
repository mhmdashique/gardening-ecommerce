import Link from "next/link";
import { Sprout } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-leaf-mint/50 px-4 py-16 text-center">
      <Brand />
      <div className="mt-9 grid h-14 w-14 place-items-center rounded-2xl bg-white text-forest-700 shadow-soft">
        <Sprout className="h-6 w-6" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-forest-600">404 · Not found</p>
      <h1 className="display-title mt-2 max-w-xl text-balance text-[30px] font-semibold text-forest-950 sm:text-[38px]">
        This plant has moved to another pot.
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        The page you were looking for is not here. Browse the collection or head back to your dashboard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonClasses()}>Shop plants</Link>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>Go home</Link>
        <Link href="/account" className={buttonClasses({ variant: "ghost" })}>My account</Link>
      </div>
    </main>
  );
}
