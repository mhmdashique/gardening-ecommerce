import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/demo-store";
import { DEMO_COOKIE, verifyDemoSession } from "@/lib/demo-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@/lib/types";

function normaliseProfile(
  profile: Record<string, unknown>,
  fallback: { id: string; email?: string | null },
): User {
  return {
    id: String(profile.id ?? fallback.id),
    email: String(profile.email ?? fallback.email ?? ""),
    full_name: String(profile.full_name ?? "Plant Lover"),
    phone: (profile.phone as string | null) ?? null,
    role: profile.role === "admin" ? "admin" : "customer",
    is_blocked: Boolean(profile.is_blocked),
    loyalty_points: Number(profile.loyalty_points ?? 0),
    created_at: (profile.created_at as string | undefined) ?? undefined,
    avatar_url: (profile.avatar_url as string | null) ?? null,
  };
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_blocked, loyalty_points, created_at, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        return normaliseProfile({ ...profile, email: user.email }, { id: user.id, email: user.email });
      }
      return {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string | undefined) ?? "Plant Lover",
        phone: (user.phone as string | undefined) ?? null,
        role: "customer",
        is_blocked: false,
        loyalty_points: 0,
      };
    } catch {
      return null;
    }
  }

  const store = await cookies();
  const payload = await verifyDemoSession(store.get(DEMO_COOKIE)?.value);
  if (!payload) return null;
  const dbUser = getDb().users.find((u) => u.id === payload.id);
  if (!dbUser) return null;
  return dbUser;
});

export async function requireUser(nextPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }
  if (user.is_blocked) {
    redirect("/blocked");
  }
  return user;
}

export async function requireAdmin(nextPath = "/admin") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (user.is_blocked) {
    redirect("/blocked");
  }
  if (user.role !== "admin") {
    redirect("/forbidden");
  }
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" && !user.is_blocked;
}
