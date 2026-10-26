"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Headphones,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { QuantityStepper } from "@/components/interactive";
import { useToast } from "@/components/toast";
import { EmptyState, buttonClasses } from "@/components/ui";
import { cn, formatINR } from "@/lib/utils";

export function CartView() {
  const {
    lines,
    totals,
    removeLine,
    setQty,
    loggedIn,
    hydrated,
  } = useCart();
  const { toast } = useToast();

  const removeWithToast = (lineName: string, variantId: string) => {
    removeLine(variantId);
    toast(`${lineName} removed from your bag.`, "info");
  };

  if (!hydrated) {
    return (
      <div className="container-shell py-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-forest-100" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-shell py-10 sm:py-14">
        <h1 className="display-title text-[30px] font-semibold text-forest-950 sm:text-[38px]">Your Bag</h1>
        <div className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            description="A little green can change a whole room. Start with something easy — we'll help you pick."
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
          <p className="eyebrow mb-1">Almost home</p>
          <h1 className="display-title text-[28px] font-semibold text-forest-950 sm:text-[34px]">Your Bag</h1>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest-700 hover:underline">
          <ChevronLeft className="h-3.5 w-3.5" /> Continue shopping
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 p-5 sm:gap-5 sm:p-6">
                  <Link href={`/product/${line.slug}`} className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-leaf-mint sm:h-[130px] sm:w-[130px]">
                    <Image
                      src={line.image || "/images/plant-placeholder.svg"}
                      alt={line.name}
                      fill
                      sizes="130px"
                      className="object-cover object-center"
                      unoptimized={line.image.startsWith("/")}
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold text-forest-800 backdrop-blur-sm shadow-sm">
                      ×{line.qty}
                    </span>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${line.slug}`} className="line-clamp-2 text-[14px] font-semibold text-forest-950 hover:underline sm:text-sm">
                          {line.name}
                        </Link>
                        <p className="mt-1 text-[11px] text-muted flex items-center gap-1">
                          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-leaf-mint/50 px-2 text-[10px] font-medium text-forest-700">
                            <span className="h-3 w-3 rounded-full bg-forest-500" />
                            {line.size} · {line.potType}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">SKU {line.sku}</p>
                        {line.stock <= 5 && (
                          <p className="mt-1 text-[10px] font-semibold text-amber-ink">Only {line.stock} left in stock</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWithToast(line.name, line.variantId)}
                        className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4 border-t border-line/50">
                      <div className="flex items-center gap-2">
                        <QuantityStepper
                          value={line.qty}
                          onChange={(qty) => setQty(line.variantId, qty)}
                          max={line.stock || 20}
                          size="sm"
                          label={`Quantity for ${line.name}`}
                        />
                        <span className="text-[10px] text-muted">{formatINR(line.price)} each</span>
                      </div>
                      <p className="text-sm font-bold text-forest-950">{formatINR(line.price * line.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/shop"
            className={buttonClasses({
              variant: "secondary",
              className: "w-full border-dashed bg-leaf-mint/40 hover:bg-leaf-mint",
            })}
          >
            <Plus className="h-4 w-4" /> Add More Plants
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card flex flex-col p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-[12.5px] font-semibold text-forest-950">No returns on live plants</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Live plants are delicate and perishable once delivered, so standard returns or change-of-mind refunds aren&apos;t supported.
              </p>
              <p className="mt-3 space-y-1 border-t border-line pt-3 text-[10px] text-muted">
                <span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-forest-600" /> Secure payment via Cashfree</span>
                <span className="flex items-center gap-2"><Truck className="h-3 w-3 text-forest-600" /> Carefully packed, dispatched in 24–48 hours</span>
              </p>
            </div>
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-[104px] lg:self-start">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold text-forest-950">Order summary</h2>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between text-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-forest-900">{formatINR(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Discount</dt>
                  <dd className={cn("font-medium", totals.discount > 0 ? "text-success-ink" : "text-forest-900")}>
                    {totals.discount > 0 ? `− ${formatINR(totals.discount)}` : formatINR(0)}
                  </dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Delivery</dt>
                  <dd className="font-medium text-forest-900">
                    {totals.deliveryCharge === 0 ? "Free" : formatINR(totals.deliveryCharge)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold text-forest-950">
                  <dt>Total</dt>
                  <dd>{formatINR(totals.total)}</dd>
                </div>
                <p className="text-[10px] text-muted">Includes {formatINR(totals.gst, true)} GST</p>
              </dl>
            </div>
            <Link href={loggedIn ? "/checkout" : "/login?next=/checkout"} className={buttonClasses({ className: "mt-2 w-full" })}>
              {loggedIn ? "Proceed to Checkout" : "Log in to Checkout"} <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-forest-600" />
                <p className="text-[12.5px] font-semibold text-forest-950">Need a hand?</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Questions about plant care, potting or delivery? Our experts are here to help.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest-700 hover:underline"
              >
                Talk to a plant expert <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
