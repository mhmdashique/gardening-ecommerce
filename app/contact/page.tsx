import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sprout,
  Truck,
} from "lucide-react";
import { getSettings } from "@/lib/catalog";
import { SectionHeading, buttonClasses } from "@/components/ui";
import { ContactForm } from "@/components/account-forms";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Questions about an order, a plant or a delivery? Reach the Leaf & Pot team by email or phone, or read the quick answers.",
  alternates: { canonical: "/contact" },
};

const faqs = [
  {
    q: "When will my order ship?",
    a: "Orders are packed within 24–48 hours of confirmation. Delivery estimates depend on your pincode and are shown on the product page and at checkout.",
  },
  {
    q: "My plant arrived damaged. What now?",
    a: "Send a photo of the plant and packaging within the damage-claim window shown in our returns policy. We will arrange a replacement or a refund once reviewed.",
  },
  {
    q: "Can I change my delivery address?",
    a: "If the order has not been packed yet, contact us with the order number. Once dispatched, the courier may be able to redirect the parcel.",
  },
  {
    q: "Do you deliver to my pincode?",
    a: "Use the pincode checker on any product page. If there is no override for your pincode, we deliver to valid Indian pincodes using our standard charge.",
  },
];

const contactChannels = [
  {
    href: "mailto:STORE_EMAIL",
    icon: Mail,
    title: "Email us",
    blurb: "Best for order details and photos.",
    chip: "Replies within a day",
  },
  {
    href: "tel:STORE_PHONE",
    icon: Phone,
    title: "Call us",
    blurb: "Quick questions during studio hours.",
    chip: "Mon – Sat",
  },
] as const;

export default async function ContactPage() {
  const settings = await getSettings();
  const tel = settings.store_phone.replace(/\s+/g, "");

  return (
    <div className="container-shell py-12 sm:py-16">
      {/* Header */}
      <header className="max-w-2xl animate-fade-up">
        <p className="eyebrow">
          <Sprout className="h-3.5 w-3.5" aria-hidden />
          We are here
        </p>
        <h1 className="display-title mt-3 text-balance text-[34px] font-semibold leading-tight text-forest-950 sm:text-[44px]">
          Let&apos;s talk about your plants
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-[14px] leading-relaxed text-muted">
          Order questions, care worries or feedback — one small team reads every message. Include your order
          number when you have one, and a photo if something looks wrong.
        </p>
      </header>

      {/* Channel cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contactChannels.map(({ href, icon: Icon, title, blurb, chip }) => (
          <a
            key={title}
            href={href.replace("STORE_EMAIL", settings.store_email).replace("STORE_PHONE", tel)}
            className="card group relative p-6 transition duration-200 hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-leaf-soft to-leaf-mint text-forest-700 ring-1 ring-inset ring-leaf-sage/60 transition group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </span>
              <span className="chip bg-leaf-mint text-forest-600 ring-1 ring-inset ring-leaf-sage/50">
                {chip}
              </span>
            </div>
            <h2 className="mt-4 font-display text-[18px] font-semibold text-forest-950">{title}</h2>
            <p className="mt-1 text-[12.5px] text-muted">{blurb}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-forest-800">
              {title === "Email us" ? settings.store_email : settings.store_phone}
              <span className="text-forest-400 transition group-hover:translate-x-0.5 group-hover:text-forest-600" aria-hidden>
                →
              </span>
            </p>
          </a>
        ))}

        <div className="card relative p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-leaf-soft to-leaf-mint text-forest-700 ring-1 ring-inset ring-leaf-sage/60">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="chip bg-forest-50 text-muted ring-1 ring-inset ring-line">
              By appointment
            </span>
          </div>
          <h2 className="mt-4 font-display text-[18px] font-semibold text-forest-950">Visit the studio</h2>
          <p className="mt-1 text-[12.5px] text-muted">Pickup by appointment only.</p>
          <p className="mt-4 text-[12.5px] font-semibold text-forest-800">{settings.store_address}</p>
        </div>
      </div>

      {/* Form + sidebar */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ContactForm />

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-mint text-forest-700">
                <Clock className="h-4 w-4" />
              </span>
              <h2 className="font-display text-[18px] font-semibold text-forest-950">Studio hours</h2>
            </div>
            <dl className="mt-5 space-y-0 overflow-hidden rounded-xl border border-line text-[12.5px]">
              {[
                { day: "Monday – Friday", hours: "9:00 am – 6:00 pm" },
                { day: "Saturday", hours: "10:00 am – 3:00 pm" },
                { day: "Sunday", hours: "Closed" },
              ].map((row, i) => (
                <div
                  key={row.day}
                  className={`flex items-center justify-between gap-4 bg-white px-4 py-3 ${i < 2 ? "border-b border-line/80" : ""}`}
                >
                  <dt className="text-muted">{row.day}</dt>
                  <dd className={row.hours === "Closed" ? "font-medium text-muted" : "font-medium text-forest-900"}>
                    {row.hours}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex gap-2.5 rounded-xl bg-leaf-mint/70 px-3.5 py-3 text-[11.5px] leading-relaxed text-forest-800 ring-1 ring-inset ring-leaf-sage/50">
              <Sprout className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
              <span>
                We reply to emails within one working day. If your plant arrived damaged, please write in as soon
                as you unbox it so we can help inside the claim window.
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/account/orders" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                <Truck className="h-3.5 w-3.5" /> Track an order
              </Link>
              <Link href="/policies/returns" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                <MessageCircle className="h-3.5 w-3.5" /> Returns policy
              </Link>
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="Quick answers" title="Before you write in" />
            <div className="mt-4 space-y-2.5">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-line bg-white shadow-sm transition open:border-forest-200 open:shadow-soft [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-[12.5px] font-semibold text-forest-950">
                    {faq.q}
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf-mint text-forest-600 transition group-open:rotate-180">
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </summary>
                  <p className="border-t border-line/70 px-4 py-3 text-[12px] leading-relaxed text-muted">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-muted">
              Delivery charges, free-shipping thresholds and return windows are shown in the{" "}
              <Link href="/policies/shipping" className="font-semibold text-forest-700 underline underline-offset-2">
                shipping policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
