import type { Metadata } from "next";
import { Info, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDeliveryZones, getSettings } from "@/lib/catalog";
import { SettingsForm, ZoneManager } from "@/components/admin-forms";

export const metadata: Metadata = { title: "Store Configuration & Settings | Admin", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");
  const [settings, zones] = await Promise.all([getSettings(), getDeliveryZones()]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">Store Configuration</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Live Engine Rules
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Configure financial GST rates, free delivery thresholds, COD validation, and loyalty rewards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              settings.cod_enabled
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${settings.cod_enabled ? "bg-emerald-500" : "bg-gray-400"}`} />
            Cash on Delivery {settings.cod_enabled ? "Active" : "Disabled"}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              settings.online_payment_enabled
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${settings.online_payment_enabled ? "bg-emerald-500" : "bg-gray-400"}`} />
            Cashfree / Online {settings.online_payment_enabled ? "Active" : "Disabled"}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              settings.loyalty_enabled
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${settings.loyalty_enabled ? "bg-emerald-500" : "bg-gray-400"}`} />
            Loyalty Engine {settings.loyalty_enabled ? "Active" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Main Settings Form Container */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <SettingsForm settings={settings} />
      </section>

      {/* Delivery Zones Section */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-forest-950">
              <Truck className="h-4 w-4 text-emerald-700" /> Regional Delivery Zones &amp; Pincode Overrides
            </h2>
            <p className="mt-1 text-xs text-muted">
              Add specific pincodes to customize dispatch fees and estimated delivery ETAs.
            </p>
          </div>
          <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-bold text-forest-900">
            {zones.length} Active Overrides
          </span>
        </div>
        <div className="mt-6">
          <ZoneManager zones={zones} />
        </div>
      </section>

      {/* Setup Guide Notes Card */}
      <section className="rounded-3xl border border-line bg-surface-subtle/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-forest-700" />
          <h3 className="font-display text-sm font-bold text-forest-950">System Architecture &amp; Accounting Notes</h3>
        </div>
        <ul className="space-y-2 text-xs leading-relaxed text-muted">
          <li>
            <strong className="text-forest-900">Tax Calculations (GST):</strong> All listed catalog plant prices are GST inclusive. The tax breakdown is dynamically computed and displayed on checkout receipts.
          </li>
          <li>
            <strong className="text-forest-900">Loyalty Currency:</strong> Earn and redeem ratios apply to delivered and completed orders automatically when enabled.
          </li>
          <li>
            <strong className="text-forest-900">Administrative Security:</strong> Superadmin access is verified against Supabase service role and RLS profiles on every route handler.
          </li>
        </ul>
      </section>
    </div>
  );
}

