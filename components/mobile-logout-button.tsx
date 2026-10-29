"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

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
        toast("You've been logged out. See you soon! 🌱", "success");
      }}
      className={className}
    >
      <button
        type="submit"
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/25 bg-white p-3 text-danger-ink font-semibold shadow-sm transition",
          variant === "solid"
            ? "bg-danger-soft text-danger border-transparent hover:bg-danger hover:text-white"
            : "hover:bg-danger/50 hover:border-danger/50",
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
