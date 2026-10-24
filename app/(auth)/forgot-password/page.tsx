import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Forgot Password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-6">
        <p className="eyebrow mb-2">A little help</p>
        <h1 className="display-title text-[32px] font-semibold leading-tight text-forest-950">Reset your password</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Enter the email you signed up with and we&apos;ll send a secure reset link.
        </p>
      </div>
      <ForgotForm />
    </>
  );
}
