import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui";

export const metadata = { title: "403 — Access denied", robots: { index: false, follow: false } };

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-leaf-mint px-4 text-center">
      <Brand />
      <div className="mt-10 grid h-16 w-16 place-items-center rounded-2xl bg-white text-danger shadow-soft">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-forest-600">403 · Access denied</p>
      <h1 className="display-title mt-2 max-w-xl text-balance text-[32px] font-semibold text-forest-950 sm:text-[40px]">
        This area is for the Leaf &amp; Pot team.
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        Your account is signed in, but it doesn&apos;t have admin access. If you think this is a mistake, please contact
        the store owner.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/account" className={buttonClasses()}>Go to my dashboard</Link>
        <Link href="/shop" className={buttonClasses({ variant: "secondary" })}>Continue shopping</Link>
      </div>
    </main>
  );
}
