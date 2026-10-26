"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "@/components/onboarding";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("leafandpot:onboarding-completed") : null;
    setCompleted(stored === "true");
  }, []);

  if (completed === null) return null;

  if (!completed) {
    return (
      <Onboarding onComplete={() => {
        localStorage.setItem("leafandpot:onboarding-completed", "true");
        setCompleted(true);
      }} />
    );
  }

  return <>{children}</>;
}
