"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, MapPin, Navigation } from "lucide-react";
import {
  forgotPasswordAction,
  googleLoginAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  type AuthState,
} from "@/lib/actions/auth";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { detectCurrentLocation } from "@/lib/geolocation";
import { cn } from "@/lib/utils";

const initial: AuthState = {};

function Alert({ state }: { state: AuthState }) {
  if (!state.error && !state.success) return null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3 text-[12px] leading-relaxed",
        state.error ? "border-danger/20 bg-danger-soft text-danger-ink" : "border-success/20 bg-success-soft text-success-ink",
      )}
      role={state.error ? "alert" : "status"}
    >
      {state.error ?? state.success}
    </div>
  );
}

function PasswordInput({
  name,
  id,
  autoComplete,
  placeholder = "••••••••",
}: {
  name: string;
  id: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-leaf-mint"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function GoogleButton() {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await googleLoginAction();
          if (result?.error) toast(result.error, "info");
        })
      }
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white text-sm font-semibold text-forest-900 transition hover:bg-leaf-mint disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.62A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.41 13.94a6 6 0 0 1 0-3.88V7.44H3.06a10 10 0 0 0 0 9.12l3.35-2.62Z" />
          <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.57 9.57 0 0 0 12 2a10 10 0 0 0-8.94 5.44l3.35 2.62C7.2 7.7 9.4 5.94 12 5.94Z" />
        </svg>
      )}
      Continue with Google
    </button>
  );
}

export function LoginForm({ next, demoMode }: { next?: string; demoMode: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast(state.success, "success");
      router.push(state.redirectTo || "/");
    }
  }, [state.success, state.redirectTo, toast, router]);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <Alert state={state} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field label="Email address" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="current-password" />
        </Field>
        <div className="flex items-center justify-between">
          <Checkbox name="remember" label="Remember me" />
          <Link href="/forgot-password" className="text-[11.5px] font-semibold text-forest-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] uppercase tracking-wider text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton />

      {demoMode && (
        <div className="rounded-xl border border-dashed border-forest-200 bg-leaf-mint/60 p-3.5 text-[11px] leading-relaxed text-forest-800">
          <p className="font-semibold">Local demo accounts</p>
          <p className="mt-1 text-muted">
            Customer: <code className="rounded bg-white px-1">priya@example.com</code> /{" "}
            <code className="rounded bg-white px-1">demo1234</code>
            <br />
            Admin: <code className="rounded bg-white px-1">admin@leafandpot.in</code> /{" "}
            <code className="rounded bg-white px-1">demo1234</code>
          </p>
        </div>
      )}
    </div>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();

  const handleGetLocation = async () => {
    try {
      setLocating(true);
      const loc = await detectCurrentLocation();
      setAddress((prev) => ({
        ...prev,
        line1: loc.line1 || prev.line1,
        line2: loc.line2 || prev.line2,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        pincode: loc.pincode || prev.pincode,
      }));
      toast("Location detected! Address filled successfully.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to detect location", "error");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-5">
      <Alert state={state} />
      {!state.success && (
        <form action={formAction} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          <Field label="Full name" htmlFor="full_name">
            <Input id="full_name" name="full_name" autoComplete="name" placeholder="Priya Sharma" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email address" htmlFor="reg-email">
              <Input id="reg-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </Field>
            <Field label="Mobile number" htmlFor="reg-phone">
              <Input id="reg-phone" name="phone" inputMode="numeric" autoComplete="tel" placeholder="98765 43210" required />
            </Field>
          </div>
          <Field label="Password" htmlFor="reg-password" hint="At least 8 characters, with a letter and a number.">
            <PasswordInput id="reg-password" name="password" autoComplete="new-password" />
          </Field>

          {/* Delivery Address Section */}
          <div className="rounded-2xl border border-line bg-surface-subtle/50 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-forest-950">
                <MapPin className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Delivery Address</h3>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-400 active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Detect and auto-fill current location"
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-emerald-700" />
                )}
                <span>{locating ? "Detecting..." : "Get Location"}</span>
              </button>
            </div>
            
            <Field label="Flat, House no., Building, Street" htmlFor="reg-line1">
              <Input
                id="reg-line1"
                name="line1"
                value={address.line1}
                onChange={(e) => setAddress((prev) => ({ ...prev, line1: e.target.value }))}
                autoComplete="street-address"
                placeholder="e.g. Flat 402, Green Meadows, 12th Main"
                required
              />
            </Field>

            <Field label="Landmark / Area (optional)" htmlFor="reg-line2">
              <Input
                id="reg-line2"
                name="line2"
                value={address.line2}
                onChange={(e) => setAddress((prev) => ({ ...prev, line2: e.target.value }))}
                autoComplete="address-line2"
                placeholder="e.g. Near Botanical Garden"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="City" htmlFor="reg-city">
                <Input
                  id="reg-city"
                  name="city"
                  value={address.city}
                  onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                  autoComplete="address-level2"
                  placeholder="e.g. Bengaluru"
                  required
                />
              </Field>

              <Field label="State" htmlFor="reg-state">
                <Input
                  id="reg-state"
                  name="state"
                  value={address.state}
                  onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                  autoComplete="address-level1"
                  placeholder="e.g. Karnataka"
                  required
                />
              </Field>

              <Field label="Pincode" htmlFor="reg-pincode" className="col-span-2 sm:col-span-1">
                <Input
                  id="reg-pincode"
                  name="pincode"
                  value={address.pincode}
                  onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="560001"
                  required
                />
              </Field>
            </div>
          </div>

          <Checkbox
            name="terms"
            required
            label={
              <span className="text-[11.5px] leading-relaxed text-muted">
                I agree to the{" "}
                <Link href="/policies/terms" className="font-semibold text-forest-700 hover:underline">terms of service</Link>{" "}
                and{" "}
                <Link href="/policies/privacy" className="font-semibold text-forest-700 hover:underline">privacy policy</Link>.
              </span>
            }
          />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create my account <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] uppercase tracking-wider text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton />
    </div>
  );
}

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <Field label="Email address" htmlFor="forgot-email">
        <Input id="forgot-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>
      <Link href="/login" className="block text-center text-[11.5px] font-semibold text-forest-700 hover:underline">
        Back to login
      </Link>
    </form>
  );
}

export function ResetForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <Field label="New password" htmlFor="new-password" hint="At least 8 characters, with a letter and a number.">
        <PasswordInput id="new-password" name="password" autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm-password">
        <PasswordInput id="confirm-password" name="confirm" autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
