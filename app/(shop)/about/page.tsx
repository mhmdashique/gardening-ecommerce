import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Leaf, PackageCheck, Sprout, Sun, Users } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { SectionHeading, buttonClasses } from "@/components/ui";
import { DEMO_IMAGES } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Leaf & Pot is a Bengaluru plant studio growing indoor plants, outdoor plants and hand-finished pots, with honest care advice for every home.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Sprout,
    title: "Grown, not just sourced",
    copy: "Every batch is checked for healthy roots, strong stems and leaf colour before it is listed. If a plant is not ready, it does not ship.",
  },
  {
    icon: PackageCheck,
    title: "Packaging that protects",
    copy: "Root-safe wraps, recyclable paper and a moisture barrier keep soil where it belongs — even on a three-day journey.",
  },
  {
    icon: Heart,
    title: "Advice without the jargon",
    copy: "Light, water and repotting guidance is written for real homes, not greenhouses. Ask us anything and a plant doctor replies.",
  },
  {
    icon: Users,
    title: "Small team, accountable",
    copy: "One studio, one catalogue and one support inbox. The person who packs your order can also answer your care question.",
  },
];

const journey = [
  { step: "01", title: "Choose with confidence", copy: "Filter by light, water and pet safety so the plant suits your space." },
  { step: "02", title: "We check and pack", copy: "Orders are inspected, watered if needed and packed within 24–48 hours." },
  { step: "03", title: "Settle in together", copy: "Follow the care card, then message our plant doctors whenever something looks off." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-line bg-leaf-mint/40">
        <div className="container-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-20">
          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="display-title mt-3 text-balance text-[32px] font-semibold leading-[1.1] text-forest-950 sm:text-[42px] lg:text-[50px]">
              A plant studio for people who want to grow, not just buy.
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted">
              Leaf &amp; Pot began with a simple frustration: beautiful plants arriving tired, undersized or with no
              guidance on what to do next. We built a small studio around the opposite idea — healthy plants, honest
              descriptions and care advice that continues after checkout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className={buttonClasses()}>
                Explore the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className={buttonClasses({ variant: "secondary" })}>
                Talk to a plant doctor
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            <SafeImage src={DEMO_IMAGES.hero} alt="A light-filled room filled with indoor plants" sizes="(min-width: 1024px) 45vw, 100vw" priority />
          </div>
        </div>
      </section>

      <section className="container-shell py-12 lg:py-16">
        <SectionHeading
          eyebrow="What we stand for"
          title="Four things we refuse to compromise on"
          description="They sound obvious. They are also the reason we keep the catalogue deliberately small."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {values.map((value) => (
            <article key={value.title} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-soft text-forest-700">
                <value.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h2 className="mt-3 font-display text-[18px] font-semibold text-forest-950">{value.title}</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-shell py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="display-title mt-2 text-[26px] font-semibold text-forest-950 sm:text-[32px]">
                From our bench to your window
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
                No mystery boxes. You will know what is coming, when it ships and exactly how to look after it.
              </p>
            </div>
            <ol className="grid gap-3">
              {journey.map((item) => (
                <li key={item.step} className="flex gap-4 rounded-2xl border border-line p-4">
                  <span className="font-display text-[22px] font-semibold leading-none text-forest-300">{item.step}</span>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-forest-950">{item.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="care" className="container-shell scroll-mt-24 py-12 lg:py-16">
        <div className="overflow-hidden rounded-3xl border border-forest-100 bg-forest-950 text-white">
          <div className="grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-12">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-200">
                <Leaf className="h-4 w-4" /> Plant care support
              </p>
              <h2 className="display-title mt-3 text-balance text-[26px] font-semibold leading-tight sm:text-[34px]">
                The plant does not stop needing care after delivery.
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/65">
                Every order includes a care card matched to the plant you bought. If a leaf yellows, a stem droops or
                you are unsure about repotting, send us a photo. We will tell you what we would do — no upsell.
              </p>
            </div>
            <div className="grid gap-2.5 text-[12px]">
              {[
                { icon: Sun, label: "Light and placement guidance" },
                { icon: Sprout, label: "Repotting and soil advice" },
                { icon: Heart, label: "Damage and replacement support" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-3.5 py-2.5">
                  <item.icon className="h-4 w-4 text-forest-200" />
                  <span className="text-white/85">{item.label}</span>
                </div>
              ))}
              <Link href="/contact" className={buttonClasses({ variant: "secondary", className: "mt-1 justify-center" })}>
                Ask a question <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
