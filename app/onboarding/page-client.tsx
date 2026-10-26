"use client";

import { Onboarding } from "@/components/onboarding";

export function OnboardingPageClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-leaf-cream">
      <Onboarding onComplete={() => {}} />
    </div>
  );
}
