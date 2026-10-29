import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { VerifyEmailForm } from "@/components/account-forms";

export const metadata: Metadata = { title: "Verify email", robots: { index: false, follow: false } };

export default async function VerifyPasswordEmailPage() {
  const user = await requireUser("/account/profile/password");

  return (
    <div className="space-y-5">
      {/* Phone header: back to Settings */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account/settings"
          aria-label="Back to Settings"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest-800 shadow-sm transition hover:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="font-display text-[19px] font-semibold text-forest-950">Verify your email</h1>
      </div>

      <div className="hidden sm:block">
        <p className="eyebrow mb-1">Step 1 of 2</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Verify your email</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">
          Confirm the email on your account before we show the password form.
        </p>
      </div>

      {/* Email verification card */}
      <section className="card p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-forest-700">
            <MailCheck className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-forest-950">Email verification</h2>
            <p className="mt-0.5 text-[11.5px] text-muted">Enter the email address you use to sign in.</p>
          </div>
        </div>
        <div className="mt-4">
          <VerifyEmailForm email={user.email} />
        </div>
      </section>
    </div>
  );
}
