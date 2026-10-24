import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create Account", robots: { index: false, follow: true } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");
  const next = nextParam ? safeNextPath(nextParam, "/account") : undefined;

  return (
    <>
      <div className="mb-6">
        <p className="eyebrow mb-2">Join the greenhouse</p>
        <h1 className="display-title text-[32px] font-semibold leading-tight text-forest-950">Create your account</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Save your wishlist, track orders and get plant care help whenever you need it.
        </p>
      </div>
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-[12.5px] text-muted">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-forest-800 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
