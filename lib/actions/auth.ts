"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/demo-store";
import { DEMO_COOKIE, signDemoSession } from "@/lib/demo-session";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";

export interface AuthState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

function zodError(error: { flatten: () => { fieldErrors: Record<string, string[]>; formErrors: string[] } }): AuthState {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages?.[0]) fieldErrors[key] = messages[0];
  }
  return { error: flattened.formErrors[0] ?? Object.values(fieldErrors)[0] ?? "Please check the form.", fieldErrors };
}

async function setDemoSession(userId: string, email: string, role: "customer" | "admin") {
  const token = await signDemoSession({ id: userId, email, role, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const store = await cookies();
  store.set(DEMO_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return zodError(parsed.error);

  const headerList = await headers();
  const limit = rateLimit(clientKey(headerList, `login:${parsed.data.email}`), 8, 60_000);
  if (!limit.allowed) {
    return { error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s.` };
  }

  const next = safeNextPath(parsed.data.next, "");

  if (!isSupabaseConfigured()) {
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === parsed.data.email);
    const password = db.passwords[parsed.data.email];
    if (!user || password !== parsed.data.password) {
      return {
        error:
          "Email or password is incorrect. In local demo mode use priya@example.com / demo1234 (customer) or admin@leafandpot.in / demo1234 (admin).",
      };
    }
    if (user.is_blocked) return { error: "This account has been blocked. Please contact support." };
    await setDemoSession(user.id, user.email, user.role);
    redirect(next || (user.role === "admin" ? "/admin" : "/account"));
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "Email or password is incorrect." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_blocked")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    return { error: "This account has been blocked. Please contact support." };
  }
  redirect(next || (profile?.role === "admin" ? "/admin" : "/account"));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    line1: formData.get("line1") || undefined,
    line2: formData.get("line2") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    pincode: formData.get("pincode") || undefined,
    next: formData.get("next") || undefined,
    terms: formData.get("terms") || undefined,
  });
  if (!parsed.success) return zodError(parsed.error);

  const headerList = await headers();
  const limit = rateLimit(clientKey(headerList, "register"), 6, 60 * 60_000);
  if (!limit.allowed) return { error: "Too many sign-up attempts. Please try again later." };

  if (!isSupabaseConfigured()) {
    const db = getDb();
    if (db.users.some((user) => user.email.toLowerCase() === parsed.data.email)) {
      return { error: "An account with this email already exists. Try logging in." };
    }
    const id = `u-${Date.now()}`;
    db.users.push({
      id,
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      role: "customer",
      is_blocked: false,
      loyalty_points: 0,
      created_at: new Date().toISOString(),
    });
    db.passwords[parsed.data.email] = parsed.data.password;

    if (parsed.data.line1 && parsed.data.city && parsed.data.pincode) {
      db.addresses.push({
        id: `addr-${Date.now()}`,
        user_id: id,
        name: parsed.data.full_name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state || "India",
        pincode: parsed.data.pincode,
        is_default: true,
      });
    }

    await setDemoSession(id, parsed.data.email, "customer");
    redirect(safeNextPath(parsed.data.next, "/account"));
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/account`,
    },
  });
  if (error) return { error: error.message };

  if (data.user && parsed.data.line1 && parsed.data.city && parsed.data.pincode) {
    try {
      const admin = createAdminSupabase();
      await admin.from("addresses").insert({
        user_id: data.user.id,
        name: parsed.data.full_name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state || "",
        pincode: parsed.data.pincode,
        is_default: true,
      });
    } catch {
      // Continue even if address insert fails or awaits email confirmation
    }
  }

  if (data.session) redirect(safeNextPath(parsed.data.next, "/account"));
  return {
    success:
      "Almost there — we've sent a confirmation link to your email. Verify it, then log in to meet your new plants.",
  };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.signOut();
    } catch {
      /* session may already be gone */
    }
  }
  const store = await cookies();
  store.set(DEMO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  store.delete(DEMO_COOKIE);
  store.delete({ name: DEMO_COOKIE, path: "/" });
  redirect("/");
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return zodError(parsed.error);

  if (!isSupabaseConfigured()) {
    return {
      success: "If that email is registered, a reset link is on its way. (Demo mode: password reset emails are not sent.)",
    };
  }
  const supabase = await createServerSupabase();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });
  return { success: "If that email is registered, a reset link is on its way." };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return zodError(parsed.error);
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase to reset passwords. In demo mode, use the seeded demo credentials." };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/account?password=updated");
}

export async function googleLoginAction() {
  if (!isSupabaseConfigured()) {
    return { error: "Google sign-in needs Supabase. Use the demo credentials below to explore." };
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/account`,
    },
  });
  if (error || !data.url) return { error: error?.message ?? "Could not start Google sign-in." };
  redirect(data.url);
}

export async function sendPhoneOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phone = String(formData.get("phone") || "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9][0-9]{9}$/.test(phone)) return { error: "Enter a valid 10-digit mobile number." };
  const headerList = await headers();
  const limit = rateLimit(clientKey(headerList, `otp:${phone}`), 4, 60_000);
  if (!limit.allowed) return { error: `Please wait ${limit.retryAfterSeconds}s before requesting another code.` };

  if (!isSupabaseConfigured()) {
    return { success: `Demo OTP sent to +91 ${phone}. Use 123456 to verify.` };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
  if (error) return { error: error.message };
  return { success: `We've sent a 6-digit code to +91 ${phone}.` };
}

export async function verifyPhoneOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phone = String(formData.get("phone") || "").replace(/\D/g, "").slice(-10);
  const token = String(formData.get("token") || "").trim();
  if (!/^[6-9][0-9]{9}$/.test(phone)) return { error: "Enter a valid mobile number." };
  if (!/^[0-9]{6}$/.test(token)) return { error: "Enter the 6-digit code." };

  if (!isSupabaseConfigured()) {
    if (token !== "123456") return { error: "That code is incorrect. In demo mode, use 123456." };
    const db = getDb();
    let user = db.users.find((u) => u.phone === phone);
    if (!user) {
      user = {
        id: `u-phone-${phone}`,
        email: `${phone}@phone.leafandpot.local`,
        full_name: "Plant Lover",
        phone,
        role: "customer",
        is_blocked: false,
        loyalty_points: 0,
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
    }
    await setDemoSession(user.id, user.email, user.role);
    redirect("/account");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token, type: "sms" });
  if (error) return { error: "That code is invalid or has expired." };
  redirect("/account");
}

export async function resendVerificationAction(): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) {
    return { error: "Email verification is only available with a connected Supabase project." };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback` },
  });
  return error ? { error: error.message } : { success: "Verification email sent." };
}
