import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account-forms";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false, follow: false } };

export default async function EditProfilePage() {
  const user = await requireUser("/account/profile/edit");

  return (
    <div className="space-y-5">
      {/* Phone header: back row (reference: lands straight on the details card) */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account/profile"
          aria-label="Back to My profile"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest-800 shadow-sm transition hover:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="font-display text-[19px] font-semibold text-forest-950">Edit profile</h1>
      </div>

      <div className="hidden sm:block">
        <p className="eyebrow mb-1">Make it yours</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Edit profile</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Keep your personal details current so deliveries arrive smoothly.</p>
      </div>

      {/* Personal details card (reference layout) */}
      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Personal details</h2>
        <p className="mt-1 text-[11.5px] text-muted">Keep your contact details current so deliveries arrive smoothly.</p>
        <div className="mt-4">
          <ProfileForm fullName={user.full_name} phone={user.phone} email={user.email} />
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted">
          Your email is used to sign in and cannot be changed here. Contact support if you need to update it.
        </p>
      </section>
    </div>
  );
}
