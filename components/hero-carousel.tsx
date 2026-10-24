"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  const next = useCallback(() => setIndex((current) => (current + 1) % Math.max(count, 1)), [count]);
  const prev = () => setIndex((current) => (current - 1 + count) % Math.max(count, 1));

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(next, 6500);
    return () => window.clearInterval(timer);
  }, [count, next]);

  if (!count) return null;
  const banner = banners[index] ?? banners[0]!;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-forest-900 shadow-card" aria-roledescription="carousel" aria-label="Featured offers">
      <div className="relative aspect-[16/10] min-h-[260px] sm:aspect-[16/7] sm:min-h-[300px]">
        <SafeImage
          key={banner.id}
          src={banner.image_url ?? "/images/plant-placeholder.svg"}
          alt=""
          sizes="(max-width: 1024px) 100vw, 900px"
          priority
          className="object-cover opacity-85 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/55 to-forest-950/10" />
        <div className="absolute inset-0 flex max-w-lg flex-col justify-center p-6 sm:p-10">
          {banner.eyebrow && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-forest-200">{banner.eyebrow}</p>
          )}
          <h1 className="display-title text-balance text-[27px] font-semibold leading-[1.08] text-white sm:text-[38px]">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="mt-3 max-w-sm text-pretty text-[12.5px] leading-relaxed text-white/70 sm:text-sm">{banner.subtitle}</p>
          )}
          <div className="mt-5">
            <Link href={banner.cta_url ?? "/shop"} className={buttonClasses({ variant: "amber", size: "sm", className: "h-10 px-4" })}>
              {banner.cta_label ?? "Shop Now"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {count > 1 && (
          <>
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Previous slide"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Next slide"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute bottom-6 left-6 flex gap-1.5 sm:left-10" role="tablist" aria-label="Choose slide">
              {banners.map((item, dotIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  role="tab"
                  aria-selected={dotIndex === index}
                  aria-label={`Slide ${dotIndex + 1}: ${item.title}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    dotIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function HorizontalRow({
  children,
  title,
  href,
  linkLabel = "View all",
}: {
  children: React.ReactNode;
  title?: string;
  href?: string;
  linkLabel?: string;
}) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    if (!ref) return;
    setCanLeft(ref.scrollLeft > 4);
    setCanRight(ref.scrollLeft + ref.clientWidth < ref.scrollWidth - 4);
  }, [ref]);

  useEffect(() => {
    update();
    if (!ref) return;
    ref.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ref.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, update]);

  const scroll = (direction: 1 | -1) => {
    ref?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  return (
    <div>
      {(title || href) && (
        <div className="mb-3 flex items-end justify-between gap-3">
          {title && <h2 className="font-display text-[21px] font-semibold text-forest-950 sm:text-[24px]">{title}</h2>}
          <div className="flex items-center gap-2">
            {href && (
              <Link href={href} className="text-[11.5px] font-semibold text-forest-700 underline decoration-forest-300 underline-offset-4 hover:decoration-forest-700">
                {linkLabel}
              </Link>
            )}
            <div className="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                onClick={() => scroll(-1)}
                disabled={!canLeft}
                className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-forest-800 transition hover:bg-leaf-mint disabled:opacity-35"
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                disabled={!canRight}
                className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-forest-800 transition hover:bg-leaf-mint disabled:opacity-35"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={setRef} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:gap-4">
        {children}
      </div>
    </div>
  );
}
