"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronRight, Flower, Leaf, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui";

const steps = [
  {
    title: "Welcome to Leaf & Pot",
    subtitle: "Explore plants and find your green space.",
    icon: <Leaf className="h-8 w-8" />,
  },
  {
    title: "Sign up or log in",
    subtitle: "Quick, secure account access.",
    icon: <User className="h-8 w-8" />,
  },
  {
    title: "Choose plant preferences",
    subtitle: "Personalize recommendations or skip.",
    icon: <Flower className="h-8 w-8" />,
  },
  {
    title: "Start shopping",
    subtitle: "Browse, wishlist, cart, and checkout.",
    icon: <ShoppingBag className="h-8 w-8" />,
  },
];

function OnboardingScreen({
  step,
  index,
  total,
  onNext,
  onSkip,
}: {
  step: (typeof steps)[number];
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = index === total - 1;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {index > 0 && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[11px] font-medium text-muted hover:text-forest-800"
          >
            Skip
          </button>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {index + 1} / {total}
        </span>
      </div>

      <div className="grid h-24 w-24 place-items-center rounded-full bg-leaf-soft text-forest-700 mb-6">
        {step.icon}
      </div>

      <h1 className="display-title text-[28px] font-semibold leading-tight text-forest-950 text-center">
        {step.title}
      </h1>
      <p className="text-[13px] leading-relaxed text-muted text-center">
        {step.subtitle}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isLast ? (
          <Button
            type="button"
            onClick={onNext}
            size="lg"
            className="w-full sm:w-auto"
          >
            Start shopping <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={onNext}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={onSkip}
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
            >
              Skip
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (index === steps.length - 1) {
      onComplete();
      router.push("/shop");
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    router.push("/shop");
  };

  return (
    <div className="min-h-screen bg-leaf-cream flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16">
      <div className="max-w-[480px] w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8"
        >
          <Leaf className="h-5 w-5 text-forest-600" />
          <span className="display-title text-[18px] font-semibold tracking-tight text-forest-950">
            Leaf <span className="text-forest-500">&</span> Pot
          </span>
        </Link>

        <OnboardingScreen
          step={steps[index]!}
          index={index}
          total={steps.length}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </div>
    </div>
  );
}
