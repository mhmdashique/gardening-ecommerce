import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/utils";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Log In", robots: { index: false, follow: true } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : safeNextPath(nextParam, "/account"));

  const next = nextParam ? safeNextPath(nextParam, "/account") : undefined;

  return (
    <>
      <div className="mb-6">
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="display-title text-[32px] font-semibold leading-tight text-forest-950">Let&apos;s get you growing.</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Log in to see your orders, saved plants and care reminders.
        </p>
      </div>
      <LoginForm next={next} demoMode={!isSupabaseConfigured()} />
      <p className="mt-6 text-center text-[12.5px] text-muted">
        New to Leaf &amp; Pot?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-forest-800 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
