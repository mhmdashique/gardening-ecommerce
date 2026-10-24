import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Choose a New Password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-6">
        <p className="eyebrow mb-2">Almost there</p>
        <h1 className="display-title text-[32px] font-semibold leading-tight text-forest-950">Choose a new password</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Make it something memorable — at least 8 characters with a letter and a number.
        </p>
      </div>
      <ResetForm />
    </>
  );
}
