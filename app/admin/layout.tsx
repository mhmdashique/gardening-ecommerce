import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminNotifications } from "@/lib/catalog";
import { AdminShell } from "@/components/shells";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin("/admin");
  const { notifications, unread } = await getAdminNotifications(user.id);
  return (
    <AdminShell user={user} notifications={notifications} unread={unread}>
      {children}
    </AdminShell>
  );
}
