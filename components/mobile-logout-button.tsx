"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

/**
 * Logout control with a farewell toast. `MobileLogoutButton` is the phone-only
 * variant used across the mobile account screens; `LogoutButton` is the plain
 * reusable form (used in the desktop Settings page).
 */
export function LogoutButton({
  variant = "solid",
  className,
}: {
  variant?: "solid" | "soft";
  className?: string;
}) {
  const { toast } = useToast();

  return (
    <form
      action={logoutAction}
      onSubmit={() => {
        // Say goodbye before the server action navigates away.
        toast("You've been logged out. See you soon! 🌱", "success");
      }}
      className={className}
    >
      <button
        type="submit"
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition",
          variant === "solid"
            ? "bg-forest-900 text-white shadow-sm hover:bg-forest-800"
            : "border border-line/80 bg-white text-forest-800 shadow-[0_1px_2px_rgba(18,56,42,0.04)] hover:border-forest-200 hover:bg-leaf-mint",
        )}
      >
        <LogOut className="h-4 w-4" strokeWidth={1.9} /> Log out
      </button>
    </form>
  );
}

export function MobileLogoutButton({ variant = "solid" }: { variant?: "solid" | "soft" }) {
  return (
    <div className="sm:hidden">
      <LogoutButton variant={variant} />
    </div>
  );
}
