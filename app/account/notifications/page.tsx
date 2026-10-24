import type { Metadata } from "next";
import { Bell, Check } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCustomerNotifications } from "@/lib/catalog";
import { markNotificationsReadAction } from "@/lib/actions/account";
import { MarkReadButton } from "@/components/account-forms";
import { Button, EmptyState } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

const icons: Record<string, string> = {
  order: "📦",
  offer: "🌿",
  return: "↩️",
  loyalty: "✨",
  system: "🔔",
};

export default async function AccountNotificationsPage() {
  const user = await requireUser("/account");
  const notifications = await getCustomerNotifications(user.id);
  const unread = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{unread ? `${unread} unread` : "All caught up"}</p>
          <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Notifications</h1>
          <p className="mt-1.5 text-[12.5px] text-muted">Order updates, offers and plant care notes in one place.</p>
        </div>
        {unread > 0 && (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When your order moves or a new offer lands, it will show up here."
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {notifications.map((notification) => (
            <article key={notification.id} className={cn("flex gap-3 p-4 sm:p-5", !notification.is_read && "bg-leaf-mint/40")}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm" aria-hidden>
                {icons[notification.type] ?? icons.system}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-forest-950">{notification.title}</p>
                  {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forest-600" aria-label="Unread" />}
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{notification.body}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted/80">
                  <span>{timeAgo(notification.created_at)}</span>
                  <MarkReadButton notification={notification} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
