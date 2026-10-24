"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SafeImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [source, setSource] = useState(src || "/images/plant-placeholder.svg");

  useEffect(() => {
    setSource(src || "/images/plant-placeholder.svg");
  }, [src]);
  const isLocal = source.startsWith("/");
  const props = {
    src: source,
    alt,
    className: cn("object-cover", className),
    sizes: sizes ?? "(max-width: 768px) 50vw, 25vw",
    priority,
    unoptimized: isLocal,
  };
  if (fill)
    return (
      // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through the spread props above
      <Image {...props} fill />
    );
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through the spread props above
  return <Image {...props} width={width ?? 600} height={height ?? 600} />;
}
