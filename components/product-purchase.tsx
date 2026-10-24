"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  Droplets,
  Heart,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sun,
  ThermometerSun,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { QuantityStepper } from "@/components/interactive";
import { Stars } from "@/components/stars";
import { useToast } from "@/components/toast";
import { Badge, buttonClasses } from "@/components/ui";
import { toggleWishlistAction } from "@/lib/actions/account";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import type { CartLine, Product } from "@/lib/types";

export function ProductPurchase({
  product,
  wishlisted,
  loggedIn,
  freeShippingThreshold,
}: {
  product: Product;
  wishlisted: boolean;
  loggedIn: boolean;
  freeShippingThreshold: number;
}) {
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const [variantId, setVariantId] = useState(
    (activeVariants.find((variant) => variant.stock > 0) ?? activeVariants[0])?.id ?? "",
  );
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(wishlisted);
  const [wishPending, startWish] = useTransition();
  const [addPending, startAdd] = useTransition();
  const [pin, setPin] = useState("");
  const [pinState, setPinState] = useState<{ loading: boolean; message?: string; ok?: boolean }>({ loading: false });
  const { addLine } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const variant = activeVariants.find((entry) => entry.id === variantId) ?? activeVariants[0];
  const price = variant?.price ?? 0;
  const compare = variant?.compare_at_price ?? null;
  const discount = discountPercent(price, compare);
  const stock = variant?.stock ?? 0;

  const line: CartLine | null = variant
    ? {
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: variant.sku,
        image: product.images[0] ?? "/images/plant-placeholder.svg",
        size: variant.size,
        potType: variant.pot_type,
        price: variant.price,
        compareAtPrice: variant.compare_at_price,
        qty,
        stock: variant.stock,
        categoryId: product.category_id,
      }
    : null;

  const add = (goToCheckout = false) => {
    if (!line || stock <= 0) {
      toast("That size is out of stock. Please choose another size.", "info");
      return;
    }
    startAdd(() => {
      addLine(line, qty);
      if (goToCheckout) {
        router.push(loggedIn ? "/checkout" : "/login?next=/checkout");
      } else {
        toast(`${product.name} added to your bag.`);
      }
    });
  };

  const toggleWishlist = () => {
    if (!loggedIn) {
      toast("Log in to save this plant to your wishlist.", "info");
      router.push(`/login?next=/product/${product.slug}`);
      return;
    }
    startWish(async () => {
      const result = await toggleWishlistAction(product.id);
      if (result.loginRequired) {
        toast(result.error ?? "Please log in.", "info");
        return;
      }
      setSaved(Boolean(result.wishlisted));
      toast(result.wishlisted ? "Saved to your wishlist." : "Removed from your wishlist.");
    });
  };

  const checkPincode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPinState({ loading: false, ok: false, message: "Enter a valid 6-digit pincode." });
      return;
    }
    setPinState({ loading: true });
    try {
      const response = await fetch(`/api/pincode?pincode=${pin}`);
      const data = (await response.json()) as {
        serviceable: boolean;
        estimatedDays?: number;
        charge?: number;
        message?: string;
      };
      setPinState({
        loading: false,
        ok: data.serviceable,
        message: data.serviceable
          ? `Delivers in ${data.estimatedDays ?? 4} days · ${data.charge === 0 ? "Free delivery" : `₹${data.charge} delivery`}`
          : data.message ?? "Enter a valid 6-digit pincode.",
      });
    } catch {
      setPinState({ loading: false, ok: false, message: "Could not check this pincode. Try again." });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/category/${product.category_slug}`} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-forest-800">
          {product.category_name}
        </Link>
        {product.badge && (
          <Badge tone={product.badge === "New" ? "blue" : product.badge === "Popular" ? "violet" : "amber"}>{product.badge}</Badge>
        )}
      </div>
      <h1 className="display-title mt-2 text-balance text-[30px] font-semibold leading-[1.1] text-forest-950 sm:text-[40px]">
        {product.name}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Stars rating={product.rating} count={product.review_count} size="md" showValue />
        <a href="#reviews" className="text-[11.5px] font-medium text-forest-700 underline decoration-forest-300 underline-offset-4 hover:decoration-forest-700">
          Read reviews
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2.5">
        <p className="text-[30px] font-bold leading-none text-forest-950">{formatINR(price)}</p>
        {compare && compare > price && (
          <>
            <p className="pb-0.5 text-sm text-muted line-through">{formatINR(compare)}</p>
            <span className="mb-0.5 rounded-full bg-success-soft px-2 py-0.5 text-[10.5px] font-semibold text-success-ink">
              {discount}% off
            </span>
          </>
        )}
      </div>
      <p className="mt-1 text-[10.5px] text-muted">
        Inclusive of all taxes · Free shipping over {formatINR(freeShippingThreshold)}
      </p>

      <p className="mt-4 text-pretty text-[13.5px] leading-relaxed text-muted">{product.description}</p>

      <div className="mt-5">
        <p className="label-base mb-3">Choose Size &amp; Pot Variant</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeVariants.map((entry) => {
            const selected = entry.id === variantId;
            const out = entry.stock <= 0;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setVariantId(entry.id);
                  setQty(1);
                }}
                className={cn(
                  "relative h-20 rounded-xl border px-3 py-4 text-left transition-all",
                  selected
                    ? "border-forest-700 bg-leaf-soft ring-2 ring-forest-700 shadow-sm"
                    : "border-line bg-white hover:border-forest-300 hover:shadow-sm",
                  out && "opacity-50 grayscale-[0.5]",
                )}
                aria-pressed={selected}
                disabled={out}
              >
                <div className="absolute top-2 right-2 rounded-full h-5 w-5 flex items-center justify-center bg-white/80 shadow-xs">
                  {selected ? (
                    <Check className="h-2.5 w-2.5 text-forest-700" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted" />
                  )}
                </div>
                <span className="block truncate text-[12px] font-semibold text-forest-950 leading-tight">
                  {entry.size}
                </span>
                <span className="block truncate text-[9.5px] text-muted mt-0.5">{entry.pot_type}</span>
                <span className="block text-[11px] font-bold text-forest-950 mt-1">{formatINR(entry.price)}</span>
                <span className={cn("block text-[8.5px]", out ? "font-semibold text-danger" : entry.stock <= 5 ? "font-semibold text-amber-ink" : "text-muted")}>
                  {out ? "Out of stock" : entry.stock <= 5 ? `Only ${entry.stock} left` : `In stock (${entry.stock})`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(stock, 10))} />
        <button
          type="button"
          onClick={() => add(false)}
          disabled={addPending || stock <= 0}
          className={buttonClasses({ className: "h-11 min-w-[180px] flex-1 sm:flex-none" })}
        >
          {addPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
          {stock <= 0 ? "Out of stock" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishPending}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl border transition",
            saved ? "border-danger/30 bg-danger-soft text-danger" : "border-line bg-white text-forest-700 hover:border-forest-300",
          )}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
        >
          <Heart className={cn("h-[18px] w-[18px]", saved && "fill-current")} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => add(true)}
        disabled={addPending || stock <= 0}
        className={buttonClasses({ variant: "secondary", className: "mt-2.5 w-full" })}
      >
        Buy it now <ArrowRight className="h-4 w-4" />
      </button>

      <div className="mt-5 rounded-xl border border-line bg-leaf-mint/50 p-3.5">
        <form onSubmit={checkPincode} className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-forest-600" />
          <label htmlFor="pincode" className="sr-only">Check delivery pincode</label>
          <input
            id="pincode"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter delivery pincode"
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-xs outline-none focus:border-forest-400"
          />
          <button type="submit" className="h-9 shrink-0 rounded-lg bg-white px-3 text-[11px] font-semibold text-forest-900 shadow-sm hover:bg-forest-50" disabled={pinState.loading}>
            {pinState.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check"}
          </button>
        </form>
        {pinState.message && (
          <p className={cn("mt-2 flex items-center gap-1.5 pl-6 text-[11px]", pinState.ok ? "text-success-ink" : "text-danger")}>
            {pinState.ok && <Check className="h-3 w-3" />}
            {pinState.message}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-line bg-surface-subtle p-3.5">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
          <div>
            <p className="text-[12px] font-semibold text-forest-950">7-Day Damage Cover</p>
            <p className="text-[11px] leading-relaxed text-muted">
              Live arrival guarantee: If your plant arrives damaged or wilted during transit, report within 7 days for a hassle-free free replacement.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 border-t border-line/60 pt-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-[12px] font-semibold text-forest-950">No Return Policy</p>
            <p className="text-[11px] leading-relaxed text-muted">
              No return will be available. As delicate living plants are perishable once delivered, standard returns or change-of-mind refunds are not supported.
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-2">
        {[
          { icon: Sun, label: "Light", value: product.light },
          { icon: Droplets, label: "Water", value: product.water },
          { icon: ThermometerSun, label: "Care", value: product.difficulty },
        ].map((item) => (
          <li key={item.label} className="rounded-xl border border-line bg-white p-2.5 text-center">
            <item.icon className="mx-auto h-4 w-4 text-forest-500" />
            <p className="mt-1 text-[9.5px] uppercase tracking-wide text-muted">{item.label}</p>
            <p className="text-[11px] font-semibold text-forest-900">{item.value}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {product.pet_friendly && <Badge tone="green">Pet friendly</Badge>}
        {product.air_purifying && <Badge tone="blue">Air purifying</Badge>}
        <Badge tone="neutral">Easy to care</Badge>
      </div>
    </div>
  );
}
