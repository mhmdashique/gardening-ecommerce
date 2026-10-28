"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Download,
  Loader2,
  Lock,
  MapPin,
  PackageCheck,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { QuantityStepper } from "@/components/interactive";
import { useToast } from "@/components/toast";
import { openCashfreeCheckout } from "@/components/cashfree-checkout";
import { EmptyState, Field, Input, Textarea, buttonClasses } from "@/components/ui";
import { computeTotals } from "@/lib/pricing";
import { cn, formatINR } from "@/lib/utils";
import type { Address, SiteSettings, User } from "@/lib/types";

interface CashfreeHandoff {
  appId?: string;
  mode?: string;
  paymentSessionId: string;
  gatewayOrderId?: string;
}

const emptyAddress = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

/**
 * Remembers the order placed in this tab so that returning to /checkout (back
 * button, refresh after payment) shows the confirmation instead of an empty bag.
 */
const LAST_ORDER_KEY = "leaf-and-pot-last-order";

interface LastOrder {
  orderNumber: string;
  orderId?: string;
  at: number;
}

function readLastOrder(): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    const parsed = raw ? (JSON.parse(raw) as LastOrder) : null;
    if (parsed?.orderNumber && Date.now() - parsed.at < 60 * 60 * 1000) return parsed;
    return null;
  } catch {
    return null;
  }
}

function rememberOrder(orderNumber: string, orderId?: string) {
  try {
    window.sessionStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify({ orderNumber, orderId, at: Date.now() } satisfies LastOrder),
    );
  } catch {
    /* storage may be unavailable (private mode) */
  }
}

export function CheckoutView({
  user,
  addresses,
  settings,
  loyaltyBalance,
}: {
  user: User;
  addresses: Address[];
  settings: SiteSettings;
  loyaltyBalance: number;
}) {
  const router = useRouter();
  const { lines, coupon, clear, hydrated, zoneCharge, setZoneCharge, setQty, removeLine } = useCart();
  const { toast } = useToast();

  const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
  const [addressId, setAddressId] = useState<string | null>(defaultAddress?.id ?? "new");
  const [form, setForm] = useState({ ...emptyAddress, name: user.full_name, phone: user.phone ?? "" });
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    settings.online_payment_enabled ? "online" : "cod",
  );
  const [notes, setNotes] = useState("");
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [onlineIssue, setOnlineIssue] = useState<{
    reference: string;
    mode: "cancelled" | "pending" | "error";
    message: string;
  } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [zoneMessage, setZoneMessage] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; orderId?: string } | null>(null);
  const [restoringOrder, setRestoringOrder] = useState(false);

  const usingNew = addressId === "new";
  const canRedeem = settings.loyalty_enabled && settings.loyalty_redeem_rate > 0 && loyaltyBalance > 0;

  const potentialLoyaltyDiscount = useMemo(
    () =>
      canRedeem
        ? computeTotals({
            lines,
            settings,
            coupon,
            zoneCharge,
            loyaltyPointsToRedeem: loyaltyBalance,
            loyaltyPointsBalance: loyaltyBalance,
          }).loyaltyDiscount
        : 0,
    [canRedeem, lines, settings, coupon, zoneCharge, loyaltyBalance],
  );

  const summaryTotals = useMemo(
    () =>
      computeTotals({
        lines,
        settings,
        coupon,
        zoneCharge,
        loyaltyPointsToRedeem: useLoyalty ? loyaltyBalance : 0,
        loyaltyPointsBalance: loyaltyBalance,
      }),
    [lines, settings, coupon, zoneCharge, useLoyalty, loyaltyBalance],
  );

  // Keep the client estimate in step with the selected delivery pincode.
  useEffect(() => {
    const pincode = usingNew
      ? form.pincode
      : (addresses.find((address) => address.id === addressId)?.pincode ?? "");
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setZoneCharge(null);
      setZoneMessage(null);
      return;
    }
    let active = true;
    fetch(`/api/pincode?pincode=${pincode}`)
      .then((response) => response.json())
      .then((data: { serviceable: boolean; charge?: number; estimatedDays?: number; message?: string }) => {
        if (!active) return;
        if (data.serviceable) {
          setZoneCharge(data.charge ?? null);
          setZoneMessage(`Delivers in about ${data.estimatedDays ?? 4} days`);
        } else {
          setZoneCharge(null);
          setZoneMessage(data.message ?? "Enter a valid 6-digit pincode.");
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [addressId, form.pincode, addresses, setZoneCharge, usingNew]);

  // If the cart is empty but an order was just placed in this tab, send the
  // user to the confirmation instead of the "Nothing to check out yet" screen.
  const restoringRef = useRef(false);
  useEffect(() => {
    if (!hydrated || lines.length > 0 || placedOrder || onlineIssue) return;
    const last = readLastOrder();
    if (!last || restoringRef.current) return;
    restoringRef.current = true;
    setRestoringOrder(true);
    router.replace(`/checkout/success?order=${encodeURIComponent(last.orderNumber)}`);
  }, [hydrated, lines.length, placedOrder, onlineIssue, router]);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const validateNewAddress = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Enter the recipient's name.";
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) next.phone = "Enter a valid 10-digit mobile number.";
    if (form.line1.trim().length < 5) next.line1 = "Enter the street address.";
    if (form.city.trim().length < 2) next.city = "Enter city.";
    if (form.state.trim().length < 2) next.state = "Enter state.";
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) next.pincode = "Enter a valid 6-digit pincode.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const finish = (orderNumber: string, orderId?: string) => {
    // Record the order first, navigate, then clear the bag. The confirmation
    // screen below renders as soon as the bag empties, so the user never sees
    // the "Nothing to check out yet" state after placing an order.
    setPlacedOrder({ orderNumber, orderId });
    rememberOrder(orderNumber, orderId);
    router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    clear();
  };

  const completePayment = async (reference: string, attempts = 5) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch("/api/checkout/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          orderNumber?: string;
          pending?: boolean;
          retryable?: boolean;
          error?: string;
        };
        if (response.ok && data.ok && data.orderNumber) {
          return { ok: true as const, orderNumber: data.orderNumber };
        }
        if (data.pending) {
          if (attempt < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            continue;
          }
          return { pending: true as const, error: data.error };
        }
        return { ok: false as const, retryable: Boolean(data.retryable), error: data.error };
      } catch {
        if (attempt < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return {
          ok: false as const,
          retryable: false,
          error: "We couldn't confirm the payment. Please check again in a moment.",
        };
      }
    }
    return { pending: true as const };
  };

  const openCashfree = async (handoff: CashfreeHandoff, reference: string) => {
    const result = await openCashfreeCheckout({
      appId: handoff.appId,
      mode: handoff.mode,
      paymentSessionId: handoff.paymentSessionId,
    });

    if (result.redirect) {
      setOnlineIssue({
        reference,
        mode: "pending",
        message:
          "Complete the payment in the opened window. We'll confirm it and create your order as soon as Cashfree reports success.",
      });
      return;
    }
    if (result.sdkError === "load") {
      setOnlineIssue({
        reference,
        mode: "cancelled",
        message:
          "We couldn't open the payment window, so no order was created. Your bag is still saved — please try again.",
      });
      return;
    }
    if (!result.completed) {
      setOnlineIssue({
        reference,
        mode: "cancelled",
        message:
          "Payment was cancelled, so no order was created. Your bag is still saved — you can try again whenever you're ready.",
      });
      return;
    }

    toast("Payment received. Creating your order…");
    const completed = await completePayment(reference);
    if ("ok" in completed && completed.ok) {
      toast("Order confirmed.");
      finish(completed.orderNumber);
      return;
    }
    if ("pending" in completed && completed.pending) {
      setOnlineIssue({
        reference,
        mode: "pending",
        message:
          "Your payment succeeded. We're waiting for Cashfree to confirm it, then your order will be created automatically. This usually takes a few seconds.",
      });
      return;
    }
    const retryable = "retryable" in completed ? completed.retryable : false;
    setOnlineIssue({
      reference,
      mode: retryable ? "cancelled" : "error",
      message:
        ("error" in completed && completed.error) ||
        "We received your payment but couldn't create the order. Please contact support with this reference.",
    });
  };

  const submitCheckout = async () => {
    setError(null);
    setOnlineIssue(null);
    if (lines.length === 0) return;
    if (usingNew && !validateNewAddress()) return;
    if (!usingNew && !addressId) {
      setError("Choose a delivery address.");
      return;
    }

    setPlacing(true);
    try {
      const payload: Record<string, unknown> = {
        items: lines.map((line) => ({ variantId: line.variantId, qty: line.qty })),
        coupon_code: coupon?.code,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        use_loyalty: canRedeem && useLoyalty ? true : undefined,
        save_address: usingNew ? saveAddress : undefined,
      };
      if (usingNew) {
        payload.address = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          line1: form.line1.trim(),
          line2: form.line2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode,
        };
      } else {
        payload.address_id = addressId;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        orderId?: string;
        orderNumber?: string;
        checkoutReference?: string;
        cashfree?: CashfreeHandoff | null;
        simulatedPayment?: boolean;
      };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "We couldn't place your order. Please try again.");
        return;
      }

      if (data.checkoutReference && data.cashfree) {
        toast("Opening secure payment…");
        await openCashfree(data.cashfree, data.checkoutReference);
        return;
      }

      if (!data.orderNumber) {
        setError("We couldn't confirm the order. Please try again.");
        return;
      }

      toast(
        data.simulatedPayment
          ? "Order placed. Payment simulated in demo mode."
          : "Order placed successfully.",
      );
      finish(data.orderNumber, data.orderId);
    } catch {
      setError("Something went wrong while placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    void submitCheckout();
  };

  const retryPayment = () => {
    setOnlineIssue(null);
    void submitCheckout();
  };

  const checkAgain = async () => {
    if (!onlineIssue) return;
    setCheckingPayment(true);
    try {
      const completed = await completePayment(onlineIssue.reference, 3);
      if ("ok" in completed && completed.ok) {
        toast("Order confirmed.");
        finish(completed.orderNumber);
        return;
      }
      if ("pending" in completed && completed.pending) {
        setOnlineIssue({
          ...onlineIssue,
          mode: "pending",
          message:
            "Cashfree is still confirming the payment. This usually takes a few seconds — please check again shortly.",
        });
        return;
      }
      const retryable = "retryable" in completed ? completed.retryable : false;
      setOnlineIssue({
        ...onlineIssue,
        mode: retryable ? "cancelled" : "error",
        message:
          ("error" in completed && completed.error) ||
          "We couldn't confirm the payment. Please contact support with this reference.",
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="container-shell py-10">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-forest-100" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (onlineIssue) {
    const cancelled = onlineIssue.mode === "cancelled";
    return (
      <div className="container-shell py-10 sm:py-14">
        <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-9">
          <span
            className={cn(
              "mx-auto grid h-14 w-14 place-items-center rounded-2xl",
              cancelled ? "bg-amber-soft text-amber-ink" : "bg-leaf-soft text-forest-700",
            )}
          >
            <CreditCard className="h-6 w-6" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-forest-950">
            {cancelled
              ? "Payment not completed"
              : onlineIssue.mode === "pending"
                ? "Confirming your payment"
                : "Payment received"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{onlineIssue.message}</p>
          <p className="mt-3 rounded-xl bg-leaf-mint/60 px-3 py-2 text-[11.5px] text-forest-800">
            Payment reference: <strong>{onlineIssue.reference}</strong>
          </p>
          {cancelled ? (
            <p className="mt-2 text-[11.5px] text-muted">
              No order was created and no money was captured for this attempt. Your bag is still saved.
            </p>
          ) : (
            <p className="mt-2 text-[11.5px] text-muted">
              Your order will appear in My Orders only after the payment is confirmed. Please don&apos;t pay again while
              we check this reference.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {cancelled ? (
              <button type="button" onClick={retryPayment} className={buttonClasses()}>
                <CreditCard className="h-4 w-4" /> Try payment again
              </button>
            ) : (
              <button type="button" onClick={checkAgain} disabled={checkingPayment} className={buttonClasses()}>
                {checkingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {checkingPayment ? "Checking…" : "Check again"}
              </button>
            )}
            <Link href="/cart" className={buttonClasses({ variant: "secondary" })}>
              Back to bag
            </Link>
            <Link href="/account/orders" className={buttonClasses({ variant: "ghost" })}>
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    // An order was just placed here — show the confirmation, never an empty bag.
    if (placedOrder?.orderNumber) {
      return (
        <div className="container-shell py-10 sm:py-14">
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-9">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success-soft text-success-ink">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="eyebrow mt-5">Order placed</p>
            <h1 className="display-title mt-1.5 text-[26px] font-semibold text-forest-950 sm:text-[32px]">
              Thank you — your order is in
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Order <strong className="text-forest-900">{placedOrder.orderNumber}</strong> is saved. You can review
              the details, download the invoice, or keep browsing while we get it packed.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={
                  placedOrder.orderId
                    ? `/account/orders/${placedOrder.orderId}`
                    : `/checkout/success?order=${encodeURIComponent(placedOrder.orderNumber)}`
                }
                className={buttonClasses()}
              >
                <Package className="h-4 w-4" /> View order details
              </Link>
              {placedOrder.orderId && (
                <a
                  href={`/api/orders/${placedOrder.orderId}/invoice`}
                  className={buttonClasses({ variant: "secondary" })}
                >
                  <Download className="h-4 w-4" /> Download invoice
                </a>
              )}
            </div>
            <div className="mt-3">
              <Link href="/shop" className={buttonClasses({ variant: "ghost" })}>
                Browse plants <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (restoringOrder) {
      return (
        <div className="container-shell py-10 sm:py-14">
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-9">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-forest-600" />
            <h1 className="mt-4 font-display text-xl font-semibold text-forest-950">Returning to your order…</h1>
            <p className="mt-2 text-[13px] text-muted">
              Your bag is empty because your order was just placed. Taking you back to the confirmation.
            </p>
            <Link href="/account/orders" className={buttonClasses({ variant: "secondary" })}>
              Open My Orders
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="container-shell py-10 sm:py-14">
        <h1 className="display-title text-[30px] font-semibold text-forest-950 sm:text-[38px]">Checkout</h1>
        <div className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="Nothing to check out yet"
            description="Your bag is empty. Add a plant or two and we'll get them growing at your place."
            action={
              <Link href="/shop" className={buttonClasses()}>
                Browse plants <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Secure checkout</p>
          <h1 className="display-title text-[28px] font-semibold text-forest-950 sm:text-[34px]">Almost home</h1>
        </div>
        <Link href="/cart" className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest-700 hover:underline">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to bag
        </Link>
      </div>

      <form onSubmit={placeOrder} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="delivery-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="delivery-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
                <MapPin className="h-4 w-4 text-forest-600" /> Delivery address
              </h2>
            </div>

            <div className="mt-4 space-y-2.5">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition",
                    addressId === address.id
                      ? "border-forest-500 bg-leaf-mint/60 ring-1 ring-forest-500"
                      : "border-line hover:border-forest-300",
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                    className="mt-1 h-4 w-4 accent-forest-700"
                  />
                  <span className="min-w-0 text-[12.5px] leading-relaxed text-forest-900">
                    <span className="flex items-center gap-2 font-semibold">
                      {address.name}
                      {address.is_default && (
                        <span className="rounded-full bg-leaf-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-forest-700">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-muted">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.pincode}
                    </span>
                    <span className="mt-0.5 block text-muted">Phone {address.phone}</span>
                  </span>
                </label>
              ))}

              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition",
                  usingNew ? "border-forest-500 bg-leaf-mint/60 ring-1 ring-forest-500" : "border-dashed border-line hover:border-forest-300",
                )}
              >
                <input
                  type="radio"
                  name="address"
                  value="new"
                  checked={usingNew}
                  onChange={() => setAddressId("new")}
                  className="h-4 w-4 accent-forest-700"
                />
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-forest-900">
                  <Plus className="h-3.5 w-3.5" /> Deliver to a new address
                </span>
              </label>
            </div>

            {usingNew && (
              <div className="mt-4 grid gap-3.5 rounded-xl bg-leaf-mint/40 p-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="co-name" error={fieldErrors.name} required>
                  <Input id="co-name" value={form.name} onChange={update("name")} autoComplete="name" />
                </Field>
                <Field label="Mobile number" htmlFor="co-phone" error={fieldErrors.phone} required>
                  <Input
                    id="co-phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Address line 1" htmlFor="co-line1" error={fieldErrors.line1} className="sm:col-span-2" required>
                  <Input id="co-line1" value={form.line1} onChange={update("line1")} autoComplete="address-line1" />
                </Field>
                <Field label="Address line 2" htmlFor="co-line2" hint="Apartment, landmark, area (optional)" className="sm:col-span-2">
                  <Input id="co-line2" value={form.line2} onChange={update("line2")} autoComplete="address-line2" />
                </Field>
                <Field label="City" htmlFor="co-city" error={fieldErrors.city} required>
                  <Input id="co-city" value={form.city} onChange={update("city")} autoComplete="address-level2" />
                </Field>
                <Field label="State" htmlFor="co-state" error={fieldErrors.state} required>
                  <Input id="co-state" value={form.state} onChange={update("state")} autoComplete="address-level1" />
                </Field>
                <Field label="Pincode" htmlFor="co-pin" error={fieldErrors.pincode} required>
                  <Input
                    id="co-pin"
                    value={form.pincode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, pincode: event.target.value.replace(/\D/g, "").slice(0, 6) }))
                    }
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </Field>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-forest-800">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                      className="h-4 w-4 accent-forest-700"
                    />
                    Save this address for next time
                  </label>
                </div>
              </div>
            )}

            {zoneMessage && (
              <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-forest-700">
                <Truck className="h-3.5 w-3.5" /> {zoneMessage}
              </p>
            )}
          </section>

          <section className="card p-5" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
              <Lock className="h-4 w-4 text-forest-600" /> Payment method
            </h2>
            <div className="mt-4 space-y-2.5">
              {settings.online_payment_enabled && (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition",
                    paymentMethod === "online"
                      ? "border-forest-500 bg-leaf-mint/60 ring-1 ring-forest-500"
                      : "border-line hover:border-forest-300",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="mt-1 h-4 w-4 accent-forest-700"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-forest-950">
                      <CreditCard className="h-4 w-4 text-forest-600" /> UPI, card, netbanking or wallet
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">
                      Secure payment via Cashfree — UPI, cards, netbanking and wallets. Your card details never touch our
                      servers.
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-forest-700">
                      Your order is created only after the payment succeeds.
                    </span>
                  </span>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-forest-500" />
                </label>
              )}

              {settings.cod_enabled && (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition",
                    paymentMethod === "cod"
                      ? "border-forest-500 bg-leaf-mint/60 ring-1 ring-forest-500"
                      : "border-line hover:border-forest-300",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 h-4 w-4 accent-forest-700"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-forest-950">
                      <Banknote className="h-4 w-4 text-forest-600" /> Cash on delivery
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">
                      Pay in cash when your plants arrive. Please keep the exact amount ready.
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-forest-700">
                      Your order is saved as soon as you place it.
                    </span>
                  </span>
                </label>
              )}
            </div>

            <Field label="Order notes" htmlFor="co-notes" hint="Delivery instructions, gate code or a gift message (optional)" className="mt-4">
              <Textarea
                id="co-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                className="min-h-[86px]"
              />
            </Field>
          </section>

          <section className="card p-5" aria-labelledby="items-heading">
            <div className="flex items-center justify-between">
              <h2 id="items-heading" className="font-display text-lg font-semibold text-forest-950">
                In your bag
              </h2>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add plants
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {lines.map((line) => (
                <li key={line.variantId} className="flex items-start gap-3 py-3">
                  <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-leaf-mint">
                    <Image
                      src={line.image || "/images/plant-placeholder.svg"}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-forest-950">{line.name}</span>
                    <span className="block text-[11px] text-muted">
                      {line.size} · {line.potType}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <QuantityStepper
                        value={line.qty}
                        onChange={(qty) => setQty(line.variantId, qty)}
                        max={line.stock || 20}
                        size="sm"
                        label={`Quantity for ${line.name}`}
                      />
                      <span className="text-[10px] text-muted">{formatINR(line.price)} each</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[12.5px] font-semibold text-forest-950">
                      {formatINR(line.price * line.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(line.variantId)}
                      className="rounded-md p-1 text-muted transition hover:bg-danger-soft hover:text-danger"
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit lg:sticky lg:top-[104px]">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-forest-950">Order summary</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="font-medium text-forest-900">{formatINR(summaryTotals.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Discount{coupon ? ` (${coupon.code})` : ""}</dt>
                <dd className={cn("font-medium", summaryTotals.discount > 0 ? "text-success-ink" : "text-forest-900")}>
                  {summaryTotals.discount > 0 ? `− ${formatINR(summaryTotals.discount)}` : formatINR(0)}
                </dd>
              </div>
              {summaryTotals.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-muted">
                  <dt>Leaf points ({summaryTotals.loyaltyPointsUsed})</dt>
                  <dd className="font-medium text-success-ink">− {formatINR(summaryTotals.loyaltyDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <dt>Delivery</dt>
                <dd className="font-medium text-forest-900">
                  {summaryTotals.deliveryCharge === 0 ? "Free" : formatINR(summaryTotals.deliveryCharge)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold text-forest-950">
                <dt>Total</dt>
                <dd>{formatINR(summaryTotals.total)}</dd>
              </div>
              <p className="text-[10px] text-muted">Includes {formatINR(summaryTotals.gst, true)} GST</p>
            </dl>

            {canRedeem && potentialLoyaltyDiscount > 0 && (
              <label
                className={cn(
                  "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-[11.5px] transition",
                  useLoyalty
                    ? "border-forest-500 bg-leaf-mint/60 ring-1 ring-forest-500"
                    : "border-line hover:border-forest-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={useLoyalty}
                  onChange={(event) => setUseLoyalty(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-forest-700"
                />
                <span>
                  <span className="block font-semibold text-forest-950">Use my Leaf points</span>
                  <span className="mt-0.5 block text-muted">
                    {loyaltyBalance} points available — save up to {formatINR(potentialLoyaltyDiscount)}. A minimum of
                    ₹1 stays payable.
                  </span>
                </span>
              </label>
            )}

            {summaryTotals.couponError && (
              <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[11px] font-medium text-danger-ink" role="alert">
                {summaryTotals.couponError}
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[11px] font-medium text-danger-ink" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={placing} className={buttonClasses({ className: "mt-4 w-full", size: "lg" })}>
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {paymentMethod === "cod" ? "Placing order…" : "Opening secure payment…"}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {paymentMethod === "cod"
                    ? "Place order"
                    : `Pay ${formatINR(summaryTotals.total)} securely`}
                </>
              )}
            </button>

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-[10.5px] text-muted">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-forest-600" /> Server-verified pricing and stock
              </p>
              <p className="flex items-center gap-2">
                <PackageCheck className="h-3.5 w-3.5 text-forest-600" /> Dispatched within 24–48 hours
              </p>
              <p className="flex items-center gap-2">
                <BadgeCheck className="h-3.5 w-3.5 text-forest-600" /> {settings.return_window_days}-day return window
              </p>
            </div>
            {!usingNew && saveAddress && <p className="sr-only">Saved address selected.</p>}
            <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted">
              <Check className="h-3 w-3 text-forest-600" /> By placing this order you accept our{" "}
              <Link href="/policies/terms" className="underline hover:text-forest-800">
                terms
              </Link>
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
