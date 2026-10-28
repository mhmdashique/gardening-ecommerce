import type { Metadata } from "next";
import { OnboardingPageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Welcome to Leaf & Pot",
  description:
    "A quick welcome to Leaf & Pot. Discover hand-nurtured plants, thoughtful pots, and care advice for a greener home.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
