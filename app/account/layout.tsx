import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getCustomerNotifications, getSettings } from "@/lib/catalog";
import { CartProvider } from "@/components/cart-provider";
import { AccountShell } from "@/components/shells";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const [notifications, settings] = await Promise.all([getCustomerNotifications(user.id), getSettings()]);
  const unread = notifications.filter((notification) => !notification.is_read).length;

  return (
    <CartProvider settings={settings} loggedIn>
      <AccountShell user={user} notifications={notifications} unread={unread} loyaltyEnabled={settings.loyalty_enabled}>
        {children}
      </AccountShell>
    </CartProvider>
  );
}
