"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  Headphones,
  Leaf,
  Package,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
} from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/utils";

const steps = [
  {
    eyebrow: "Welcome to Leaf & Pot",
    title: "Bring home a little more life.",
    description:
      "Hand-nurtured plants, thoughtful pots, and honest care advice — delivered to your door.",
    image: "/images/landing.png",
    imageAlt: "A lush collection of healthy houseplants",
    posterTitle: "Grow a home that feels alive.",
    posterCopy:
      "Hand-nurtured plants, thoughtful pots, and care advice that helps every leaf settle in.",
    posterBadge: "Nursery to doorstep",
  },
  {
    eyebrow: "The Leaf & Pot difference",
    title: "Plants that arrive ready to thrive.",
    description:
      "We treat every plant like it is moving into its forever home, not just travelling in a box.",
    image: "/images/chinese evergreen.png",
    imageAlt: "A healthy Chinese evergreen plant",
    posterTitle: "Every leaf arrives ready to settle in.",
    posterCopy:
      "We check, pack, and send each plant with the care it needs to make the journey safely.",
    posterBadge: "Packed with care",
  },
  {
    eyebrow: "A better fit",
    title: "Tell us about your space.",
    description:
      "A few quick details help us point you toward plants that fit your light, schedule, and home.",
    image: "/images/aloevera plant.png",
    imageAlt: "An aloe vera plant in a pot",
    posterTitle: "The right plant makes all the difference.",
    posterCopy:
      "Tell us about your light and routine, and we will narrow the collection to greens that will thrive.",
    posterBadge: "Made for your space",
  },
  {
    eyebrow: "You are all set",
    title: "Your green space is waiting.",
    description:
      "Here is the edit we have pulled together. You can adjust the filters anytime in the shop.",
    image: "/images/red calathea.jpg",
    imageAlt: "A red calathea plant with patterned leaves",
    posterTitle: "Your greener chapter starts here.",
    posterCopy:
      "A home filled with living things feels calmer, softer, and a little more yours.",
    posterBadge: "Ready when you are",
  },
] as const;

const welcomeFeatures = [
  {
    icon: ShieldCheck,
    title: "Live-arrival promise",
    copy: "Every plant is checked before dispatch.",
  },
  {
    icon: Truck,
    title: "Safe, speedy delivery",
    copy: "Root-safe packing for the journey.",
  },
  {
    icon: Headphones,
    title: "Care that continues",
    copy: "Free plant advice whenever you need it.",
  },
] as const;

const differenceFeatures = [
  {
    icon: Package,
    title: "Packed for the journey",
    copy: "Breathable, root-safe packaging keeps leaves and soil settled in transit.",
  },
  {
    icon: ShieldCheck,
    title: "Inspected by hand",
    copy: "Each plant gets a final health check before it leaves the nursery.",
  },
  {
    icon: Headphones,
    title: "Support after delivery",
    copy: "Free care guidance for watering, light, and everything in between.",
  },
] as const;

const LIGHT_OPTIONS = [
  { value: "Low", label: "Low light", hint: "Shade-friendly" },
  { value: "Medium", label: "Medium light", hint: "Indirect light" },
  { value: "Bright", label: "Bright light", hint: "Sunny spot" },
] as const;

const WATER_OPTIONS = [
  { value: "Low", label: "Low water", hint: "Occasional" },
  { value: "Medium", label: "Medium water", hint: "Weekly" },
  { value: "High", label: "High water", hint: "Thirsty" },
] as const;

type LightValue = (typeof LIGHT_OPTIONS)[number]["value"];
type WaterValue = (typeof WATER_OPTIONS)[number]["value"];

const matchPlants = [
  {
    name: "Chinese Evergreen",
    tag: "Low-light favourite",
    image: "/images/chinese evergreen.png",
  },
  {
    name: "Aloe Vera",
    tag: "Easy-care green",
    image: "/images/aloevera plant.png",
  },
  {
    name: "Lucky Bamboo",
    tag: "Calm and compact",
    image: "/images/lucky bamboo.jpg",
  },
] as const;

function StepContent({
  index,
  light,
  water,
  petFriendly,
  preferenceSummary,
  onLightChange,
  onWaterChange,
  onPetToggle,
  onEditPreferences,
}: {
  index: number;
  light: LightValue | null;
  water: WaterValue | null;
  petFriendly: boolean;
  preferenceSummary: string;
  onLightChange: (value: LightValue) => void;
  onWaterChange: (value: WaterValue) => void;
  onPetToggle: () => void;
  onEditPreferences: () => void;
}) {
  if (index === 0) {
    return (
      <div className="mt-7">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {welcomeFeatures.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-forest-900/10 bg-white p-3.5 shadow-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-soft text-forest-700">
                <feature.icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-[12px] font-semibold text-forest-950">{feature.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{feature.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-forest-100 bg-leaf-mint/60 p-3">
          <div className="flex -space-x-2.5">
            {matchPlants.map((plant) => (
              <span
                key={plant.name}
                className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-leaf-soft"
              >
                <Image
                  src={plant.image}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-forest-950">
              Nursery-nurtured, delivered with care
            </p>
            <p className="text-[11px] text-muted">
              Every plant is checked and packed by hand.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-7">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {differenceFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-forest-900/10 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-card"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-soft text-forest-700 transition group-hover:bg-forest-800 group-hover:text-white">
                <feature.icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-[12px] font-semibold text-forest-950">{feature.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{feature.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-forest-900 p-4 text-white">
          <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-forest-200" />
          <p className="text-[12px] leading-relaxed text-white/70">
            <span className="font-semibold text-white">Not sure what will thrive?</span> Our plant
            specialists can help you choose the right green for your light, schedule, and space.
          </p>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="mt-7 space-y-5">
        <fieldset>
          <legend className="flex items-center gap-2 text-[12px] font-semibold text-forest-950">
            <Sun className="h-4 w-4 text-forest-600" strokeWidth={1.8} />
            How much light does your space get?
          </legend>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {LIGHT_OPTIONS.map((option) => {
              const selected = light === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onLightChange(option.value)}
                  className={cn(
                    "rounded-xl border p-2.5 text-left transition duration-200",
                    selected
                      ? "border-forest-700 bg-forest-900 text-white shadow-sm"
                      : "border-forest-900/10 bg-white text-forest-950 hover:border-forest-300 hover:bg-leaf-mint/50",
                  )}
                >
                  <span className="flex items-center justify-between gap-1 text-[12px] font-semibold">
                    {option.label}
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[10px] leading-tight",
                      selected ? "text-white/60" : "text-muted",
                    )}
                  >
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-2 text-[12px] font-semibold text-forest-950">
            <Droplets className="h-4 w-4 text-forest-600" strokeWidth={1.8} />
            How often do you like to water?
          </legend>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {WATER_OPTIONS.map((option) => {
              const selected = water === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onWaterChange(option.value)}
                  className={cn(
                    "rounded-xl border p-2.5 text-left transition duration-200",
                    selected
                      ? "border-forest-700 bg-forest-900 text-white shadow-sm"
                      : "border-forest-900/10 bg-white text-forest-950 hover:border-forest-300 hover:bg-leaf-mint/50",
                  )}
                >
                  <span className="flex items-center justify-between gap-1 text-[12px] font-semibold">
                    {option.label}
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[10px] leading-tight",
                      selected ? "text-white/60" : "text-muted",
                    )}
                  >
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="button"
          role="switch"
          aria-checked={petFriendly}
          onClick={onPetToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-200",
            petFriendly
              ? "border-forest-300 bg-leaf-mint"
              : "border-forest-900/10 bg-white hover:border-forest-200",
          )}
        >
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition",
              petFriendly ? "bg-forest-800 text-white" : "bg-leaf-soft text-forest-700",
            )}
          >
            <PawPrint className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold text-forest-950">
              Pet-friendly plants only
            </span>
            <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">
              We will hide plants that can be toxic to curious pets.
            </span>
          </span>
          <span
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
              petFriendly ? "bg-forest-700" : "bg-forest-200",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
                petFriendly ? "left-6" : "left-1",
              )}
            />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-7">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          A few you might love
        </p>
        <Sparkles className="h-3.5 w-3.5 text-amber" />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {matchPlants.map((plant) => (
          <div
            key={plant.name}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-forest-900/10 bg-leaf-soft"
          >
            <Image
              src={plant.image}
              alt={plant.name}
              fill
              sizes="(max-width: 640px) 30vw, 150px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/95 via-forest-950/75 to-forest-950/30 p-2.5">
              <p className="text-[10px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                {plant.name}
              </p>
              <p className="hidden text-[9px] leading-tight text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:block">
                {plant.tag}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-forest-100 bg-leaf-mint/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-700">
              Your plant match
            </p>
            <p className="mt-1.5 text-[13px] font-semibold text-forest-950">
              {preferenceSummary || "A little of everything"}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditPreferences}
            className="shrink-0 text-[11px] font-semibold text-forest-700 underline decoration-forest-300 underline-offset-4 transition hover:text-forest-950"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {preferenceSummary
            ? "We will open the shop with these filters applied. You can change them anytime."
            : "No filters selected — we will show you the full collection. You can narrow it down in the shop."}
        </p>
      </div>
    </div>
  );
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [light, setLight] = useState<LightValue | null>(null);
  const [water, setWater] = useState<WaterValue | null>(null);
  const [petFriendly, setPetFriendly] = useState(false);
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(overlay.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null,
      );

    overlay.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (!overlay.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first || document.activeElement === overlay) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const meta = steps[index] ?? steps[0];
  const isLast = index === steps.length - 1;

  const preferenceSummary = [
    light ? `${light} light` : null,
    water ? `${water} water` : null,
    petFriendly ? "Pet-friendly" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const toggleLight = (value: LightValue) => {
    setLight((current) => (current === value ? null : value));
  };

  const toggleWater = (value: WaterValue) => {
    setWater((current) => (current === value ? null : value));
  };

  const handleNext = () => {
    if (isLast) {
      const params = new URLSearchParams();
      if (light) params.set("light", light);
      if (water) params.set("water", water);
      if (petFriendly) params.set("petFriendly", "1");
      const query = params.toString();
      onComplete();
      router.push(query ? `/shop?${query}` : "/shop");
      return;
    }

    setIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleSkip = () => {
    onComplete();
    router.push("/shop");
  };

  const handleBack = () => {
    setIndex((current) => Math.max(current - 1, 0));
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Leaf & Pot"
      tabIndex={-1}
      className="fixed -inset-32 z-[100] flex items-center justify-center bg-forest-950/55 p-3 outline-none backdrop-blur-sm sm:p-6"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-forest-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-grain opacity-25" />
      </div>

      <div className="relative grid h-[min(calc(100vh-2rem),840px)] w-full max-w-[min(1080px,calc(100vw-1.5rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[28px] border border-forest-900/10 bg-[#fdfcf8] shadow-[0_30px_80px_-32px_rgba(18,56,42,0.55)] md:grid-cols-[0.85fr_1.15fr] md:grid-rows-1">
        <aside className="relative min-h-[150px] overflow-hidden bg-forest-950 sm:min-h-[180px] md:min-h-0">
          <Image
            key={meta.image}
            src={meta.image}
            alt={meta.imageAlt}
            fill
            priority={index === 0}
            sizes="(max-width: 767px) 100vw, (max-width: 1280px) 50vw, 600px"
            className="animate-fade-in object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-950/65 via-forest-950/10 to-forest-950/85" />
          <div aria-hidden className="absolute inset-0 bg-grain opacity-20 mix-blend-soft-light" />

          <div className="relative flex h-full flex-col justify-between p-4 sm:p-5 md:p-6 lg:p-9">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-white">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur">
                  <Leaf className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="display-title text-[18px] font-semibold tracking-tight">
                  Leaf <span className="text-forest-200">&amp;</span> Pot
                </span>
              </Link>
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                {meta.posterBadge}
              </span>
            </div>

            <div className="hidden md:block">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                <Sparkles className="h-3 w-3 text-amber" />
                Plants, pots &amp; care
              </p>
              <p className="display-title mt-3 max-w-[14ch] text-[32px] font-semibold leading-[0.98] text-white lg:mt-4 lg:text-[42px] xl:text-[48px]">
                {meta.posterTitle}
              </p>
              <p className="mt-3 max-w-[34ch] text-[12px] leading-relaxed text-white/65 lg:mt-4 lg:text-[13px]">
                {meta.posterCopy}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 lg:mt-7">
                {["Live-arrival promise", "Free care support", "Safe packaging"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:hidden">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Leaf &amp; Pot
              </p>
              <p className="display-title mt-1 max-w-[20ch] text-[24px] font-semibold leading-tight text-white">
                {meta.posterTitle}
              </p>
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-0 flex-col p-4 sm:p-5 md:p-6 lg:px-9 lg:py-7 xl:px-11">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-700">
                Step {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden className="h-px w-6 bg-forest-200" />
              <span className="text-[11px] font-medium text-muted">
                {String(steps.length).padStart(2, "0")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-muted transition hover:bg-forest-50 hover:text-forest-900"
            >
              {isLast ? "Close" : "Skip tour"}
            </button>
          </header>

          <div className="mt-4 flex items-center gap-1.5" aria-hidden>
            {steps.map((step, stepIndex) => (
              <span
                key={step.eyebrow}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  stepIndex < index
                    ? "bg-forest-700"
                    : stepIndex === index
                      ? "bg-forest-500"
                      : "bg-forest-100",
                )}
              />
            ))}
          </div>

          <div key={index} className="mt-5 flex min-h-0 flex-1 animate-fade-up flex-col sm:mt-6">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              <p className="eyebrow">{meta.eyebrow}</p>
              <h1 className="display-title mt-2.5 text-balance text-[30px] font-semibold leading-[1.05] text-forest-950 sm:text-[34px] md:text-[36px] lg:text-[44px] xl:text-[48px]">
                {meta.title}
              </h1>
              <p className="mt-2.5 max-w-[46ch] text-pretty text-[13px] leading-relaxed text-muted sm:text-[14px]">
                {meta.description}
              </p>

              <StepContent
                index={index}
                light={light}
                water={water}
                petFriendly={petFriendly}
                preferenceSummary={preferenceSummary}
                onLightChange={toggleLight}
                onWaterChange={toggleWater}
                onPetToggle={() => setPetFriendly((current) => !current)}
                onEditPreferences={() => setIndex(2)}
              />
            </div>

            <footer className="mt-3 flex shrink-0 flex-col gap-2.5 border-t border-forest-900/10 pt-3 sm:mt-4 sm:pt-4 min-[880px]:flex-row min-[880px]:items-center min-[880px]:justify-between lg:mt-5">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="order-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-forest-900/10 bg-white px-4 text-[12px] font-semibold text-muted transition hover:bg-forest-50 hover:text-forest-900 min-[880px]:order-none min-[880px]:w-auto min-[880px]:border-0 min-[880px]:bg-transparent min-[880px]:px-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <span className="hidden text-[11px] text-muted min-[880px]:block">
                  Takes less than a minute
                </span>
              )}

              <div className="order-1 flex w-full flex-col gap-2 min-[880px]:order-none min-[880px]:w-auto min-[880px]:flex-row min-[880px]:items-center">
                {isLast && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="order-2 inline-flex h-11 items-center justify-center rounded-full px-4 text-[12px] font-semibold text-forest-700 transition hover:bg-forest-50 min-[880px]:order-none min-[880px]:h-12"
                  >
                    Browse everything
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className={buttonClasses({
                    size: "lg",
                    className:
                      "group order-1 h-12 w-full rounded-full bg-forest-900 px-6 text-[13px] shadow-lg shadow-forest-900/15 hover:bg-forest-950 min-[880px]:order-none min-[880px]:w-auto",
                  })}
                >
                  {isLast ? (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Start shopping
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
