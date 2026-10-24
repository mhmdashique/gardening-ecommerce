import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account-forms";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">A little about you</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Profile</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Keep your contact details current so deliveries arrive smoothly.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Personal details</h2>
          <div className="mt-4">
            <ProfileForm fullName={user.full_name} phone={user.phone} />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card p-5 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-leaf-soft font-display text-xl font-semibold text-forest-800">
              {initials(user.full_name)}
            </span>
            <p className="mt-3 font-display text-lg font-semibold text-forest-950">{user.full_name}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11.5px] text-muted">
              <Mail className="h-3 w-3" /> {user.email}
            </p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-leaf-mint px-2.5 py-1 text-[10px] font-semibold text-forest-800">
              <ShieldCheck className="h-3 w-3" /> {user.role === "admin" ? "Admin" : "Verified customer"}
            </p>
            {user.created_at && <p className="mt-3 text-[10.5px] text-muted">Member since {formatDate(user.created_at)}</p>}
          </section>
          <section className="rounded-2xl border border-forest-100 bg-leaf-mint p-4">
            <p className="text-[11px] leading-relaxed text-muted">
              Your email is used to sign in and cannot be changed here. Contact support if you need to update it.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
