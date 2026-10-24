import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/demo-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PasswordForm, PreferencesForm } from "@/components/account-forms";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function AccountSettingsPage() {
  const user = await requireUser("/account/settings");
  const preferences = isSupabaseConfigured()
    ? { email: true, whatsapp: true, sms: false }
    : (getDb().preferences[user.id] ?? { email: true, whatsapp: true, sms: false });

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">Make it yours</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Settings</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Choose how we reach you and keep your account secure.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Notifications</h2>
          <p className="mt-1 text-[11.5px] text-muted">We only send what is useful — no daily noise.</p>
          <div className="mt-4">
            <PreferencesForm email={preferences.email} whatsapp={preferences.whatsapp} sms={preferences.sms} />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold text-forest-950">Password & security</h2>
          <p className="mt-1 text-[11.5px] text-muted">Use at least 8 characters with one letter and one number.</p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Account</h2>
        <dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-3">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 font-medium text-forest-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Mobile</dt>
            <dd className="mt-0.5 font-medium text-forest-900">{user.phone ?? "Not added"}</dd>
          </div>
          <div>
            <dt className="text-muted">Account type</dt>
            <dd className="mt-0.5 font-medium capitalize text-forest-900">{user.role}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
