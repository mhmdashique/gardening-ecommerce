import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PreferencesForm } from "@/components/account-forms";
import { getDb } from "@/lib/demo-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notification preferences",
  robots: { index: false, follow: false },
};

interface StoredPreferences {
  email?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
}

/** Read the saved notification channels for the signed-in account. */
async function getPreferences(userId: string): Promise<Required<StoredPreferences>> {
  const fallback = { email: true, whatsapp: false, sms: false };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const stored = (user?.user_metadata?.notifications ?? null) as StoredPreferences | null;
      if (stored) {
        return {
          email: stored.email !== false,
          whatsapp: stored.whatsapp === true,
          sms: stored.sms === true,
        };
      }
    } catch {
      /* fall through to defaults */
    }
    return fallback;
  }

  const stored = getDb().preferences[userId];
  if (!stored) return fallback;
  return { email: stored.email !== false, whatsapp: stored.whatsapp === true, sms: stored.sms === true };
}

export default async function NotificationPreferencesPage() {
  const user = await requireUser("/account/settings/notifications");
  const preferences = await getPreferences(user.id);

  return (
    <div className="space-y-5">
      {/* Phone header: back to Settings, this page shows only the preferences form */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account/settings"
          aria-label="Back to Settings"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest-800 shadow-sm transition hover:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="font-display text-[19px] font-semibold text-forest-950">Notification preferences</h1>
      </div>

      <div className="hidden sm:block">
        <p className="eyebrow mb-1">Stay in the loop</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">
          Notification preferences
        </h1>
        <p className="mt-1.5 text-[12.5px] text-muted">
          Pick the channels we should use for order updates, delivery alerts and plant-care reminders.
        </p>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-forest-700">
            <Bell className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-forest-950">Notifications</h2>
            <p className="mt-0.5 text-[11.5px] text-muted">
              You can change these any time. Delivery-critical messages still reach you by email.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <PreferencesForm email={preferences.email} whatsapp={preferences.whatsapp} sms={preferences.sms} />
        </div>
      </section>
    </div>
  );
}
