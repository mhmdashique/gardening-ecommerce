import Link from "next/link";
import { Mail, ShieldX } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui";

export const metadata = { title: "Account unavailable", robots: { index: false, follow: false } };

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-leaf-mint px-4 text-center">
      <Brand />
      <div className="mt-10 grid h-16 w-16 place-items-center rounded-2xl bg-white text-danger shadow-soft">
        <ShieldX className="h-7 w-7" />
      </div>
      <h1 className="display-title mt-5 max-w-lg text-balance text-[30px] font-semibold text-forest-950 sm:text-[38px]">
        This account is currently unavailable.
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        If you believe this was a mistake, our team can help. Email us and we&apos;ll look into it right away.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="mailto:hello@leafandpot.in" className={buttonClasses()}>
          <Mail className="h-4 w-4" /> Contact support
        </a>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>Back to home</Link>
      </div>
    </main>
  );
}
