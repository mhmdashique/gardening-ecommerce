import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Bell,
  FileText,
  HelpCircle,
  Info,
  Lock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DeleteAccountSection } from "@/components/delete-account-section";
import { LanguagePicker } from "@/components/language-picker";
import { MobileLogoutButton, MobileMenuGroup } from "@/components/mobile-menu";
import { SafeImage } from "@/components/safe-image";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function AccountSettingsPage() {
  const user = await requireUser("/account/settings");

  return (
    <div className="space-y-5">
      {/* Phone header: back arrow + title (mobile reference design) */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account"
          aria-label="Back to dashboard"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest-800 shadow-sm transition hover:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="font-display text-[19px] font-semibold text-forest-950">Settings</h1>
      </div>

      <div className="hidden sm:block">
        <p className="eyebrow mb-1">Make it yours</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Settings</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Review your account details and manage your settings.</p>
      </div>

      {/* Phone settings menu (mobile reference design) */}
      <div className="space-y-4">
        <MobileMenuGroup
          label="Account Settings"
          rows={[
            { href: "/account/profile/password", icon: Lock, label: "Change Password", sub: "Keep your account secure", tone: "bg-leaf-mint text-forest-700" },
            {
              href: "/account/settings#notifications",
              icon: Bell,
              label: "Notification Preferences",
              sub: "Manage notifications",
              tone: "bg-leaf-mint text-forest-700",
            },
          ]}
        />
        <MobileMenuGroup
          label="App Preferences"
          rows={[
            { icon: Banknote, label: "Currency", value: "INR (₹)", tone: "bg-leaf-mint text-forest-700" },
          ]}
        />
        <LanguagePicker />

        <MobileMenuGroup
          label="Support"
          rows={[
            { href: "/contact", icon: HelpCircle, label: "Help & Support", sub: "FAQs and contact us", tone: "bg-leaf-mint text-forest-700" },
            { href: "/about", icon: Info, label: "About Leaf & Pot", sub: "Version 1.0.0", tone: "bg-leaf-mint text-forest-700" },
          ]}
        />
        <MobileMenuGroup
          label="Privacy & Security"
          rows={[
            { href: "/policies/privacy", icon: ShieldCheck, label: "Privacy Policy", sub: "How we protect your data", tone: "bg-leaf-mint text-forest-700" },
            { href: "/policies/terms", icon: FileText, label: "Terms & Conditions", sub: "Our terms of service", tone: "bg-leaf-mint text-forest-700" },
          ]}
        />

        {/* Need more help? (phone, reference) */}
        <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-leaf-mint p-3.5 shadow-card sm:hidden">
          <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl">
            <SafeImage src="/images/palm.jpg" alt="" sizes="56px" className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[13px] font-semibold text-forest-950">Need more help?</p>
            <p className="mt-0.5 text-[10.5px] text-muted">Our support team is here for you.</p>
            <Link
              href="/contact"
              className="mt-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-forest-200 bg-white px-3 text-[11px] font-semibold text-forest-800 transition hover:bg-white/90"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Contact Support
            </Link>
          </div>
        </div>

        <DeleteAccountSection />

        <MobileLogoutButton variant="soft" />
      </div>

      <div className="hidden gap-4 sm:grid">
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
          <p className="mt-4 border-t border-line pt-3 text-[10.5px] text-muted">
            Password changes and account deletion live on the{" "}
            <Link href="/account/profile" className="font-semibold text-forest-700 hover:underline">
              Profile
            </Link>{" "}
            page.
          </p>
        </section>
      </div>
    </div>
  );
}
