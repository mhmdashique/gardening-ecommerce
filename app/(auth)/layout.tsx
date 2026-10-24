import Link from "next/link";
import { Leaf, ShieldCheck, Truck } from "lucide-react";
import { Brand } from "@/components/brand";
import { SafeImage } from "@/components/safe-image";
import { getSettings } from "@/lib/catalog";
import { DEMO_IMAGES } from "@/lib/demo-data";
import { formatINR } from "@/lib/utils";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="grid min-h-screen bg-leaf-cream lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-14">
        <Brand />
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          {children}
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-wrap items-center justify-between gap-2 text-[10.5px] text-muted">
          <p>© {new Date().getFullYear()} Leaf &amp; Pot</p>
          <div className="flex gap-3">
            <Link href="/policies/privacy" className="hover:text-forest-800">Privacy</Link>
            <Link href="/policies/terms" className="hover:text-forest-800">Terms</Link>
            <Link href="/contact" className="hover:text-forest-800">Help</Link>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-forest-950 lg:block">
        <SafeImage
          src={DEMO_IMAGES.hero}
          alt="A calm, plant-filled living space"
          sizes="50vw"
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/25 to-forest-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-forest-200">
            <Leaf className="h-4 w-4" /> Grow something good
          </div>
          <p className="display-title max-w-lg text-balance text-[34px] font-semibold leading-[1.12] xl:text-[42px]">
            A greener home starts with one small, happy plant.
          </p>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/60">
            Hand-checked plants, honest care advice and packaging that arrives as carefully as it left us.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-white/70">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-forest-200" /> Free shipping over {formatINR(settings.free_shipping_threshold)}</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-forest-200" /> 7-day damage cover</span>
          </div>
        </div>
      </div>
    </div>
  );
}
