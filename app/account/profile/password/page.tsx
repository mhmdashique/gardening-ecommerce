import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/account-forms";

export const metadata: Metadata = { title: "Change password", robots: { index: false, follow: false } };

export default async function ChangePasswordPage() {
  await requireUser("/account/profile/password");

  return (
    <div className="space-y-5">
      {/* Phone header: back row (reference: lands straight on the password card) */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account/settings"
          aria-label="Back to Settings"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest-800 shadow-sm transition hover:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="font-display text-[19px] font-semibold text-forest-950">Change password</h1>
      </div>

      <div className="hidden sm:block">
        <p className="eyebrow mb-1">Keep it safe</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Change password</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Use a strong password you don't use anywhere else.</p>
      </div>

      {/* Password & security card (reference layout) */}
      <section className="card p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-forest-700">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-forest-950">Password &amp; security</h2>
            <p className="mt-0.5 text-[11.5px] text-muted">Use at least 8 characters with one letter and one number.</p>
          </div>
        </div>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
