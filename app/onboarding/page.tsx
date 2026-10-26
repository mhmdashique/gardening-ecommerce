import type { Metadata } from "next";
import { OnboardingPageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Welcome to Leaf & Pot",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
