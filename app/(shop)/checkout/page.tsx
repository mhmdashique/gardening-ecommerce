import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getAddresses, getSettings } from "@/lib/catalog";
import { CheckoutView } from "@/components/checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [addresses, settings] = await Promise.all([getAddresses(user.id), getSettings()]);

  if (!settings.online_payment_enabled && !settings.cod_enabled) {
    redirect("/cart");
  }

  return <CheckoutView user={user} addresses={addresses} settings={settings} loyaltyBalance={user.loyalty_points} />;
}
