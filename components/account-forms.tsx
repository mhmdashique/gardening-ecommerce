"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ImagePlus,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import {
  cancelOrderAction,
  deleteAddressAction,
  markNotificationReadAction,
  requestReturnAction,
  saveAddressAction,
  setDefaultAddressAction,
  submitContactAction,
  submitReviewAction,
  updatePreferencesAction,
  updateProfileAction,
  type FormState,
} from "@/lib/actions/account";
import { changePasswordAction } from "@/lib/actions/account";
import { Modal } from "@/components/interactive";
import { useToast } from "@/components/toast";
import { Badge, Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { detectCurrentLocation } from "@/lib/geolocation";
import { cn, formatDate, formatINR } from "@/lib/utils";
import type { Address, Notification, OrderItem } from "@/lib/types";

const initial: FormState = {};

function Alert({ state }: { state: FormState }) {
  if (!state.error && !state.success) return null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-[12px] leading-relaxed",
        state.error ? "border-danger/20 bg-danger-soft text-danger-ink" : "border-success/20 bg-success-soft text-success-ink",
      )}
      role={state.error ? "alert" : "status"}
    >
      {state.error ?? state.success}
    </div>
  );
}

function SubmitButton({
  pending,
  children,
  className,
  variant = "primary",
  size = "md",
}: {
  pending: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} className={className}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </Button>
  );
}

/* -------------------------------- Profile --------------------------------- */

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="profile-name" error={state.fieldErrors?.full_name} required>
          <Input id="profile-name" name="full_name" defaultValue={fullName} autoComplete="name" required />
        </Field>
        <Field label="Mobile number" htmlFor="profile-phone" error={state.fieldErrors?.phone} hint="Used for delivery updates.">
          <Input
            id="profile-phone"
            name="phone"
            defaultValue={phone ?? ""}
            inputMode="numeric"
            autoComplete="tel"
          />
        </Field>
      </div>
      <SubmitButton pending={pending}>Save changes</SubmitButton>
    </form>
  );
}

/* ------------------------------ Preferences -------------------------------- */

export function PreferencesForm({
  email,
  whatsapp,
  sms,
}: {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
}) {
  const [state, action, pending] = useActionState(updatePreferencesAction, initial);
  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <div className="space-y-3">
        <Checkbox name="email_notifications" defaultChecked={email} label={<span><strong className="font-semibold text-forest-950">Email updates</strong><span className="mt-0.5 block text-[11.5px] text-muted">Order updates, care reminders and seasonal offers.</span></span>} />
        <Checkbox name="whatsapp_notifications" defaultChecked={whatsapp} label={<span><strong className="font-semibold text-forest-950">WhatsApp updates</strong><span className="mt-0.5 block text-[11.5px] text-muted">Dispatch and delivery alerts on WhatsApp.</span></span>} />
        <Checkbox name="sms_notifications" defaultChecked={sms} label={<span><strong className="font-semibold text-forest-950">SMS updates</strong><span className="mt-0.5 block text-[11.5px] text-muted">Important delivery messages by SMS.</span></span>} />
      </div>
      <SubmitButton pending={pending}>Save preferences</SubmitButton>
    </form>
  );
}

/* -------------------------------- Password -------------------------------- */

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <Field label="Current password" htmlFor="current-password" required>
        <Input id="current-password" name="current_password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="New password" htmlFor="new-password" hint="At least 8 characters with a letter and number." required>
          <Input id="new-password" name="new_password" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password" required>
          <Input id="confirm-password" name="confirm_password" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}

/* -------------------------------- Addresses -------------------------------- */

function AddressFields({ address }: { address?: Address }) {
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [line2, setLine2] = useState(address?.line2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [state, setState] = useState(address?.state ?? "");
  const [pincode, setPincode] = useState(address?.pincode ?? "");
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLine1(address?.line1 ?? "");
    setLine2(address?.line2 ?? "");
    setCity(address?.city ?? "");
    setState(address?.state ?? "");
    setPincode(address?.pincode ?? "");
  }, [address]);

  const handleGetLocation = async () => {
    try {
      setLocating(true);
      const loc = await detectCurrentLocation();
      if (loc.line1) setLine1(loc.line1);
      if (loc.line2) setLine2(loc.line2);
      if (loc.city) setCity(loc.city);
      if (loc.state) setState(loc.state);
      if (loc.pincode) setPincode(loc.pincode);
      toast("Location detected and address updated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to detect location", "error");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="sm:col-span-2 flex items-center justify-between pb-1 border-b border-line/60">
        <span className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-700" /> Location Details
        </span>
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
      <Field label="Full name" htmlFor="addr-name" required>
        <Input id="addr-name" name="name" defaultValue={address?.name ?? ""} autoComplete="name" required />
      </Field>
      <Field label="Mobile number" htmlFor="addr-phone" required>
        <Input id="addr-phone" name="phone" defaultValue={address?.phone ?? ""} inputMode="numeric" autoComplete="tel" required />
      </Field>
      <Field label="Address line 1" htmlFor="addr-line1" className="sm:col-span-2" required>
        <Input
          id="addr-line1"
          name="line1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          autoComplete="address-line1"
          placeholder="House/Flat number, Building, Street"
          required
        />
      </Field>
      <Field label="Address line 2" htmlFor="addr-line2" className="sm:col-span-2" hint="Apartment, landmark, area (optional)">
        <Input
          id="addr-line2"
          name="line2"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          autoComplete="address-line2"
          placeholder="Landmark, Area"
        />
      </Field>
      <Field label="City" htmlFor="addr-city" required>
        <Input
          id="addr-city"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="address-level2"
          required
        />
      </Field>
      <Field label="State" htmlFor="addr-state" required>
        <Input
          id="addr-state"
          name="state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          autoComplete="address-level1"
          required
        />
      </Field>
      <Field label="Pincode" htmlFor="addr-pin" required>
        <Input
          id="addr-pin"
          name="pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          required
        />
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox name="is_default" defaultChecked={address?.is_default ?? false} label="Make this my default address" />
      </div>
    </div>
  );
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>(undefined);
  const [state, action, pending] = useActionState(saveAddressAction, initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setEditing(undefined);
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);

  const openNew = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const openEdit = (address: Address) => {
    setEditing(address);
    setOpen(true);
  };

  const remove = (id: string) =>
    startTransition(async () => {
      setBusyId(id);
      const result = await deleteAddressAction(id);
      setBusyId(null);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Address removed.");
        router.refresh();
      }
    });

  const makeDefault = (id: string) =>
    startTransition(async () => {
      setBusyId(id);
      const result = await setDefaultAddressAction(id);
      setBusyId(null);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Default address updated.");
        router.refresh();
      }
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-forest-950">Saved addresses</h2>
          <p className="mt-1 text-[12px] text-muted">Manage where your plants should arrive.</p>
        </div>
        <Button type="button" onClick={openNew} size="sm">
          <Plus className="h-3.5 w-3.5" /> Add address
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {addresses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-leaf-mint/40 p-6 text-center sm:col-span-2">
            <MapPin className="mx-auto h-6 w-6 text-forest-500" />
            <p className="mt-2 text-sm font-semibold text-forest-950">No addresses saved yet</p>
            <p className="mt-1 text-[12px] text-muted">Add one now so checkout is quicker next time.</p>
          </div>
        )}
        {addresses.map((address) => (
          <article key={address.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-semibold text-forest-950">
                  {address.name}
                  {address.is_default && <Badge tone="green">Default</Badge>}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} — {address.pincode}
                  <br />
                  Phone {address.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(address)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-leaf-mint hover:text-forest-800"
                aria-label={`Edit address for ${address.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[11px] font-semibold">
              {!address.is_default && (
                <button
                  type="button"
                  onClick={() => makeDefault(address.id)}
                  disabled={busyId === address.id}
                  className="text-forest-700 hover:underline disabled:opacity-50"
                >
                  Set as default
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(address.id)}
                disabled={busyId === address.id}
                className="inline-flex items-center gap-1 text-danger hover:underline disabled:opacity-50"
              >
                {busyId === address.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit address" : "Add a new address"}
        description="We deliver across India. Pincode availability is checked at checkout."
        size="lg"
      >
        <form key={editing?.id ?? "new"} action={action} className="space-y-4">
          <Alert state={state} />
          <AddressFields address={editing} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>{editing ? "Save address" : "Add address"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* --------------------------------- Orders --------------------------------- */

export function CancelOrderButton({ orderId, label = "Cancel order" }: { orderId: string; label?: string }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Cancel this order? Plants are reserved for you until it is packed.")) return;
        startTransition(async () => {
          const result = await cancelOrderAction(orderId);
          if (result.error) toast(result.error, "error");
          else {
            toast(result.success ?? "Order cancelled.");
            router.refresh();
          }
        });
      }}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </Button>
  );
}

export function ReviewButton({ item, orderId }: { item: OrderItem; orderId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [state, action, pending] = useActionState(submitReviewAction, initial);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setRating(5);
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Star className="h-3.5 w-3.5" /> Write a review
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Review ${item.name}`} description="Tell other plant parents how it went.">
        <form action={action} className="space-y-4">
          <Alert state={state} />
          <input type="hidden" name="product_id" value={item.product_id} />
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="rating" value={rating} />
          <div>
            <p className="label-base">Your rating</p>
            <div className="mt-1 flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  className="rounded-md p-1"
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  aria-checked={rating === value}
                  role="radio"
                >
                  <Star
                    className={cn(
                      "h-7 w-7",
                      (hover || rating) >= value ? "fill-amber text-amber" : "text-forest-200",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Field label="Your review" htmlFor="review-comment" error={state.fieldErrors?.comment} required>
            <Textarea
              id="review-comment"
              name="comment"
              placeholder="How did the plant arrive? How is it settling in?"
              required
              minLength={10}
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Submit review</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ReturnButton({ item, orderId }: { item: OrderItem; orderId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestReturnAction, initial);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Report a problem
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Help with ${item.name}`}
        description="Share a photo and a short note. Our plant team reviews every claim within 24 hours."
      >
        <form action={action} className="space-y-4">
          <Alert state={state} />
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="order_item_id" value={item.id} />
          <Field label="What went wrong?" htmlFor="return-reason" error={state.fieldErrors?.reason} required>
            <Textarea
              id="return-reason"
              name="reason"
              placeholder="Leaves damaged, wrong plant, pot cracked…"
              required
              minLength={10}
            />
          </Field>
          <Field label="Photos" htmlFor="return-photos" hint="Up to 3 photos, max 5 MB each (JPG, PNG or WebP).">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-leaf-mint/40 px-3 py-3">
              <ImagePlus className="h-4 w-4 text-forest-600" />
              <input
                id="return-photos"
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="w-full text-[11px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-forest-800 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-white"
              />
            </div>
          </Field>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Submit request</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ------------------------------ Notifications ------------------------------ */

export function MarkReadButton({ notification }: { notification: Notification }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (notification.is_read) return null;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationReadAction(notification.id);
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest-700 hover:underline disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      Mark read
    </button>
  );
}

/* ------------------------------- Loyalty note ------------------------------ */

export function LoyaltyRedeemNote({ points, value }: { points: number; value: number }) {
  return (
    <p className="rounded-xl bg-leaf-mint px-3 py-2 text-[11.5px] text-forest-800">
      You have <strong>{points}</strong> points worth <strong>{formatINR(value)}</strong>. Points are applied on
      eligible orders at checkout.
    </p>
  );
}

export function DeliveryEstimate({ createdAt, days }: { createdAt: string; days: number }) {
  return (
    <p className="text-[11px] text-muted">
      Estimated delivery {formatDate(new Date(new Date(createdAt).getTime() + days * 86400_000))}
    </p>
  );
}

/* ------------------------------- Contact Form ------------------------------ */

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactAction, initial);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (state.success) {
      setSent(true);
    }
  }, [state.success]);

  if (sent && state.success) {
    return (
      <div className="card p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-success-soft text-success-ink">
          <Check className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-forest-950">Message received</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">{state.success}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 inline-flex items-center text-xs font-semibold text-forest-800 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="card p-5 space-y-4">
      <div>
        <h2 className="font-display text-[18px] font-semibold text-forest-950">Send us a message</h2>
        <p className="mt-1 text-[12px] text-muted">Leave your details and a plant specialist will get back to you.</p>
      </div>

      <Alert state={state} />

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name" error={state.fieldErrors?.name} required>
          <Input id="contact-name" name="name" placeholder="Priya Sharma" autoComplete="name" required />
        </Field>
        <Field label="Email address" htmlFor="contact-email" error={state.fieldErrors?.email} required>
          <Input id="contact-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        </Field>
      </div>

      <Field label="Topic" htmlFor="contact-topic" required>
        <Select id="contact-topic" name="topic" defaultValue="Order help" required>
          <option value="Order help">Order help</option>
          <option value="Plant care">Plant care</option>
          <option value="Returns">Returns &amp; refunds</option>
          <option value="Wholesale">Wholesale &amp; corporate gifting</option>
          <option value="Something else">Something else</option>
        </Select>
      </Field>

      <Field label="Your message" htmlFor="contact-message" error={state.fieldErrors?.message} hint="At least 10 characters." required>
        <Textarea
          id="contact-message"
          name="message"
          rows={4}
          placeholder="How can our plant team help you today?"
          minLength={10}
          required
        />
      </Field>

      <div className="flex justify-end pt-1">
        <SubmitButton pending={pending}>Send message</SubmitButton>
      </div>
    </form>
  );
}

