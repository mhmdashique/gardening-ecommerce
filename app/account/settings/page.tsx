import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Bell,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm } from "@/components/account-forms";
import { DeleteAccountSection } from "@/components/delete-account-section";
import { LanguagePicker } from "@/components/language-picker";
import { MenuGroup } from "@/components/menu-group";
import type { MenuRow } from "@/components/menu-group";
import { MobileLogoutButton, MobileMenuGroup } from "@/components/mobile-menu";
import { LogoutButton } from "@/components/mobile-logout-button";
import { CardLabel, PremiumHero, premiumSurface } from "@/components/premium";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

const accountSettingsRows: MenuRow[] = [
  {
    href: "/account/profile/password",
    icon: Lock,
    label: "Change Password",
    sub: "Keep your account secure",
  },
  {
    href: "/account/settings/notifications",
    icon: Bell,
    label: "Notification Preferences",
    sub: "Manage notifications",
  },
];

const appPreferenceRows: MenuRow[] = [
  { icon: Banknote, label: "Currency", value: "INR (₹)" },
  { icon: Globe, label: "Language", value: "English" },
];

const supportRows: MenuRow[] = [
  { href: "/contact", icon: HelpCircle, label: "Help & Support", sub: "FAQs and contact us" },
  { href: "/about", icon: Info, label: "About Leaf & Pot", sub: "Version 1.0.0" },
];

const privacyRows: MenuRow[] = [
  { href: "/policies/privacy", icon: ShieldCheck, label: "Privacy Policy", sub: "How we protect your data" },
  { href: "/policies/terms", icon: FileText, label: "Terms & Conditions", sub: "Our terms of service" },
];

export default async function AccountSettingsPage() {
  const user = await requireUser("/account/settings");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Phone header: back arrow + title (mobile reference design) */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <Link
          href="/account"
          aria-label="Back to dashboard"
          className="grid h-10 w-10 place-items-center rounded-full border border-line/80 bg-white text-forest-800 shadow-[0_1px_2px_rgba(18,56,42,0.04),0_12px_24px_-18px_rgba(18,56,42,0.45)] transition active:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <h1 className="text-[19px] font-semibold tracking-tight text-forest-950">Settings</h1>
      </div>

      <PremiumHero
        className="hidden sm:block"
        eyebrow={
          <>
            <Sparkles className="h-3 w-3" aria-hidden /> Make it yours
          </>
        }
        title="Settings"
        description="Review your account details and manage your settings."
        aside={
          <div className="flex flex-col items-end gap-2">
            <span className="max-w-[240px] truncate text-[11.5px] text-white/60">{user.email}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-white/75 ring-1 ring-white/10">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              {user.role === "admin" ? "Admin" : "Verified customer"}
            </span>
          </div>
        }
      />

      {/* ── Phone settings menu (mobile reference design) ─────────────────── */}
      <div className="space-y-4 sm:hidden">
        <MobileMenuGroup label="Account Settings" rows={accountSettingsRows} />
        <MobileMenuGroup
          label="App Preferences"
          rows={[{ icon: Banknote, label: "Currency", value: "INR (₹)" }]}
        />
        <LanguagePicker />

        <MobileMenuGroup label="Support" rows={supportRows} />
        <MobileMenuGroup label="Privacy & Security" rows={privacyRows} />

        {/* Need more help? (phone, reference) */}
        <div className={cn(premiumSurface, "relative flex items-center gap-3 overflow-hidden p-3.5")}>
          <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line/60">
            <SafeImage src="/images/palm.jpg" alt="" sizes="56px" className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold tracking-tight text-forest-950">Need more help?</p>
            <p className="mt-0.5 text-[10.5px] text-muted">Our support team is here for you.</p>
            <Link
              href="/contact"
              className="mt-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-forest-200 bg-white px-3 text-[11px] font-semibold text-forest-800 transition hover:bg-leaf-mint"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Contact Support
            </Link>
          </div>
        </div>

        <DeleteAccountSection />

        <MobileLogoutButton variant="soft" />
      </div>

      {/* ── Website view: same sections as the mobile reference ───────────── */}
      <div className="hidden space-y-4 sm:block">
        <div className="grid gap-4 lg:grid-cols-2">
          <MenuGroup title="Account Settings" rows={accountSettingsRows} />
          <MenuGroup title="App Preferences" rows={appPreferenceRows} />
          <MenuGroup title="Support" rows={supportRows} />
          <MenuGroup title="Privacy & Security" rows={privacyRows} />
        </div>

        {/* Account details */}
        <section className={cn(premiumSurface, "p-4 sm:p-5")}>
          <CardLabel>Account details</CardLabel>
          <dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-3">
            <div>
              <dt className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Email</dt>
              <dd className="mt-0.5 font-medium text-forest-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Mobile</dt>
              <dd className="mt-0.5 font-medium text-forest-900">{user.phone ?? "Not added"}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Account type</dt>
              <dd className="mt-0.5 font-medium capitalize text-forest-900">{user.role}</dd>
            </div>
          </dl>
        </section>

        {/* Need more help? (desktop) */}
        <section className={cn(premiumSurface, "flex flex-wrap items-center gap-4 p-4 sm:p-5")}>
          <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line/60">
            <SafeImage src="/images/palm.jpg" alt="" sizes="64px" className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold tracking-tight text-forest-950">Need more help?</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Our support team is here for you — plant care, orders, or anything else.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-forest-200 bg-white px-4 text-[12px] font-semibold text-forest-800 transition hover:bg-leaf-mint"
          >
            <MessageCircle className="h-4 w-4" /> Contact Support
          </Link>
        </section>

        {/* Danger zone */}
        <section
          className={cn(
            premiumSurface,
            "flex flex-wrap items-center justify-between gap-3 border-danger/25 p-4 sm:p-5",
          )}
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-forest-950">Delete Account</h2>
            <p className="mt-0.5 text-[11.5px] text-muted">
              Permanently remove your account, orders, addresses, wishlist and reviews.
            </p>
          </div>
          <DeleteAccountForm />
        </section>

        {/* Log out */}
        <div className="pb-2">
          <LogoutButton variant="soft" className="max-w-[220px]" />
        </div>
      </div>
    </div>
  );
}
