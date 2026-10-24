"use client";

import { useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.length ? images : ["/images/plant-placeholder.svg"];
  const [selected, setSelected] = useState(0);
  const active = gallery[selected] ?? gallery[0]!;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {gallery.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelected(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-leaf-mint transition sm:h-20 sm:w-20",
                index === selected ? "border-forest-700" : "border-transparent hover:border-forest-200",
              )}
              aria-label={`View image ${index + 1} of ${gallery.length}`}
              aria-pressed={index === selected}
            >
              <SafeImage src={image} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/4.6] flex-1 overflow-hidden rounded-2xl border border-line bg-leaf-mint sm:rounded-3xl">
        <SafeImage
          key={active}
          src={active}
          alt={`${name} — image ${selected + 1}`}
          sizes="(max-width: 768px) 100vw, 520px"
          priority
          className="animate-fade-in"
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-forest-800 backdrop-blur">
          Hand-checked before dispatch
        </span>
      </div>
    </div>
  );
}
