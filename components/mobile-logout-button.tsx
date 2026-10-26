"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

export function MobileLogoutButton({ variant = "solid" }: { variant?: "solid" | "soft" }) {
  const { toast } = useToast();

  return (
    <form
      action={logoutAction}
      onSubmit={() => {
        // Say goodbye before the server action navigates away.
        toast("You've been logged out. See you soon! 🌱", "success");
      }}
      className="sm:hidden"
    >
      <button
        type="submit"
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition",
          variant === "solid"
            ? "bg-forest-900 text-white shadow-sm hover:bg-forest-800"
            : "border border-danger/25 bg-danger-soft text-danger-ink hover:border-danger/40 hover:bg-danger/10",
        )}
      >
        <LogOut className="h-4 w-4" strokeWidth={1.9} /> Log out
      </button>
    </form>
  );
}
