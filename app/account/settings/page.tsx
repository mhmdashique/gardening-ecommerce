import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bell,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Lock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm } from "@/components/account-forms";
import { LanguagePicker } from "@/components/language-picker";
import { MobileLogoutButton } from "@/components/mobile-menu";
import { LogoutButton } from "@/components/mobile-logout-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

const accountSettingsRows = [
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

const appPreferenceRows = [
  { icon: Banknote, label: "Currency", value: "INR (₹)" },
  { icon: Globe, label: "Language", value: "English" },
];

const supportRows = [
  { href: "/contact", icon: HelpCircle, label: "Help & Support", sub: "FAQs and contact us" },
  { href: "/about", icon: Info, label: "About Leaf & Pot", sub: "Version 1.0.0" },
];

const privacyRows = [
  { href: "/policies/privacy", icon: ShieldCheck, label: "Privacy Policy", sub: "How we protect your data" },
  { href: "/policies/terms", icon: FileText, label: "Terms & Conditions", sub: "Our terms of service" },
];

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">{title}</h2>
      </div>
      <ul className="divide-y divide-line">{children}</ul>
    </section>
  );
}

export default async function AccountSettingsPage() {
  await requireUser("/account/settings");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 sm:hidden">
        <Link
          href="/account"
          aria-label="Back to account"
          className="grid h-10 w-10 place-items-center rounded-full border border-line/80 bg-white text-forest-800 shadow-[0_1px_2px_rgba(18,56,42,0.04),0_12px_24px_-18px_rgba(18,56,42,0.45)] transition active:bg-leaf-mint"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </Link>
        <div>
          <h1 className="text-[19px] font-semibold tracking-tight text-forest-950">Settings</h1>
          <p className="mt-0.5 text-[11.5px] text-muted">Review your account details and manage your settings.</p>
        </div>
      </div>

      <div className="hidden sm:block">
        <div>
          <h1 className="display-title text-[24px] font-semibold text-forest-950 sm:text-[30px]">Settings</h1>
          <p className="mt-1 text-[12.5px] text-muted">Review your account details and manage your settings.</p>
        </div>
      </div>

      {/* Responsive section grid: 1 col mobile, 2 cols desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsSection title="Account Settings">
          {accountSettingsRows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
              >
                <span className="flex items-center gap-2">
                  <row.icon className="h-4 w-4 text-forest-600" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-forest-950">{row.label}</span>
                    <span className="block text-[10.5px] text-muted">{row.sub}</span>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
              </Link>
            </li>
          ))}
        </SettingsSection>

        <SettingsSection title="App Preferences">
          {appPreferenceRows.map((row) => (
            <li key={row.label}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <span className="flex items-center gap-2">
                  <row.icon className="h-4 w-4 text-forest-600" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-forest-950">{row.label}</span>
                    <span className="block text-[10.5px] text-muted">{row.value}</span>
                  </span>
                </span>
                <span className="text-[10.5px] text-muted">{row.value}</span>
              </div>
            </li>
          ))}
          <li>
            <div className="px-4 py-3 sm:px-5">
              <LanguagePicker />
            </div>
          </li>
        </SettingsSection>

        <SettingsSection title="Support">
          {supportRows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
              >
                <span className="flex items-center gap-2">
                  <row.icon className="h-4 w-4 text-forest-600" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-forest-950">{row.label}</span>
                    <span className="block text-[10.5px] text-muted">{row.sub}</span>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
              </Link>
            </li>
          ))}
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          {privacyRows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 transition hover:bg-[#f7faf7]"
              >
                <span className="flex items-center gap-2">
                  <row.icon className="h-4 w-4 text-forest-600" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-forest-950">{row.label}</span>
                    <span className="block text-[10.5px] text-muted">{row.sub}</span>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-forest-300" />
              </Link>
            </li>
          ))}
        </SettingsSection>
      </div>

      {/* Need more help? */}
      <section className={cn("card p-4 sm:p-5", "relative flex items-center gap-3 overflow-hidden")}>
        <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line/60">
          <Image
            src="/images/palm.jpg"
            alt=""
            width={56}
            height={64}
            sizes="56px"
            className="h-full w-full object-cover"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight text-forest-950">Need more help?</p>
          <p className="mt-0.5 text-[10.5px] text-muted">Our support team is here for you.</p>
        </div>
        <Link
          href="/contact"
          className="mt-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-forest-200 bg-white px-3 text-[11px] font-semibold text-forest-800 transition hover:bg-leaf-mint"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Contact Support
        </Link>
      </section>

      {/* Danger zone */}
      <section className={cn("card p-4 sm:p-5", "flex flex-wrap items-center justify-between gap-3 border-danger/25 overflow-hidden")}>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-forest-950">Delete Account</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Permanently remove your account, orders, addresses, wishlist and reviews.
          </p>
        </div>
        <DeleteAccountForm />
      </section>

      {/* Log out */}
      <section className="card p-4 sm:p-5 pb-2">
        <div className="hidden sm:block max-w-[220px]">
          <LogoutButton variant="soft" />
        </div>
        <MobileLogoutButton variant="soft" />
      </section>
    </div>
  );
}
