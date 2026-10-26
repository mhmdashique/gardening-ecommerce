"use client";

import { useEffect } from "react";

/**
 * Scrolls to URL hash sections (#details, #password, ...) after hydration,
 * because the App Router only scrolls client-side transitions to the hash,
 * not hard loads / opened-by-URL loads. scroll-mt-* on the target section
 * keeps it clear of the sticky header. Renders nothing.
 */
export function HashScroll() {
  useEffect(() => {
    const { hash } = window.location;
    if (!hash || hash === "#") return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  return null;
}
