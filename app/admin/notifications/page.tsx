import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Check, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminNotifications } from "@/lib/catalog";
import { markAdminNotificationsReadAction } from "@/lib/actions/account";
import { buttonClasses, EmptyState } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications | Admin", robots: { index: false, follow: false } };

export default async function AdminNotificationsPage() {
  const user = await requireAdmin("/admin/notifications");
  const { notifications, unread } = await getAdminNotifications(user.id, 50);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{unread ? `${unread} unread` : "All caught up"}</p>
          <h1 className="display-title text-[24px] font-semibold text-forest-950 sm:text-[30px]">Notifications</h1>
          <p className="mt-1 text-[12.5px] text-muted">New orders, feedback and control-center events in one feed.</p>
        </div>
        {unread > 0 && (
          <form action={markAdminNotificationsReadAction}>
            <button type="submit" className={buttonClasses({ variant: "secondary", size: "sm" })}>
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When a new order lands or a customer sends feedback, it shows up here."
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={cn(
                "flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5",
                !notification.is_read && "bg-emerald-50/60",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {notification.type === "admin_order" && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      New order
                    </span>
                  )}
                  {notification.type === "feedback" && (
                    <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-ink">
                      Feedback
                    </span>
                  )}
                  <p className="text-[13px] font-semibold text-forest-950">{notification.title}</p>
                  {!notification.is_read && <span className="h-2 w-2 rounded-full bg-emerald-600" aria-label="Unread" />}
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{notification.body}</p>
                <p className="mt-1.5 text-[10px] text-muted/80">{timeAgo(notification.created_at)}</p>
              </div>
              {notification.type === "admin_order" && (
                <Link
                  href={notification.orderId ? `/admin/orders/${notification.orderId}` : "/admin/orders"}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View order
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
