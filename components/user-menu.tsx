"use client";

import Link from "next/link";
import { cn, initials } from "@/lib/utils";
import type { User } from "@/lib/types";

/**
 * Avatar link in the site/account/admin headers. It opens the dashboard
 * directly (admin → /admin, customer → /account) instead of a dropdown menu.
 * Orders, wishlist, settings and logout live inside the dashboards.
 */
export function UserMenu({
  user,
  tone = "light",
  showName = true,
}: {
  user: User;
  tone?: "light" | "dark";
  showName?: boolean;
}) {
  const isAdmin = user.role === "admin";
  const href = isAdmin ? "/admin" : "/account";

  return (
    <Link
      href={href}
      title="Open dashboard"
      aria-label={isAdmin ? "Open admin dashboard" : "Open dashboard"}
      className={cn(
        "flex items-center gap-2 rounded-full border py-1 pl-1 transition",
        showName ? "pr-2.5" : "pr-1",
        tone === "light"
          ? "border-line bg-white hover:border-forest-300 hover:bg-leaf-mint"
          : "border-white/15 bg-white/5 hover:bg-white/10",
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold",
          tone === "light" ? "bg-forest-800 text-white" : "bg-white text-forest-900",
        )}
      >
        {initials(user.full_name)}
      </span>
      {showName && (
        <span
          className={cn(
            "hidden max-w-28 truncate text-xs font-semibold sm:block",
            tone === "light" ? "text-forest-900" : "text-white",
          )}
        >
          {user.full_name.split(" ")[0]}
        </span>
      )}
    </Link>
  );
}
