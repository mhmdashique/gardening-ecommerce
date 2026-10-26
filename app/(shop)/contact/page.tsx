import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getSettings } from "@/lib/catalog";
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

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  note: string;
}) {
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-forest-100 bg-white text-forest-600">
        <Icon className="h-4 w-4" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9.5px] font-semibold uppercase tracking-[0.2em] text-forest-600">{label}</span>
        <span className="mt-1 block break-words text-[13px] font-medium leading-snug text-forest-950">{value}</span>
        <span className="mt-1 block text-[11.5px] leading-relaxed text-forest-700/80">{note}</span>
      </span>
      {href ? (
        <ArrowUpRight
          className="mt-1 h-3.5 w-3.5 shrink-0 text-forest-300 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest-600"
          strokeWidth={1.7}
          aria-hidden
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className="group flex gap-3.5 py-5 transition">
        {content}
      </a>
    );
  }

  return <div className="flex gap-3.5 py-5">{content}</div>;
}

export default async function ContactPage() {
  const settings = await getSettings();
  const tel = settings.store_phone.replace(/\s+/g, "");

  const channels = [
    {
      icon: Mail,
      label: "Email",
      value: settings.store_email,
      href: `mailto:${settings.store_email}`,
      note: "Order details, photos and care questions",
    },
    {
      icon: Phone,
      label: "Phone",
      value: settings.store_phone,
      href: `tel:${tel}`,
      note: "Monday to Saturday, studio hours",
    },
    {
      icon: MapPin,
      label: "Studio",
      value: settings.store_address,
      note: "Pickup by appointment only",
    },
  ];

  return (
    <div>
      {/* Intro */}
      <section className="border-b border-forest-100/70">
        <div className="container-shell py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-forest-600">Contact</p>
            <h1 className="display-title mt-5 text-balance text-[38px] font-semibold leading-[1.06] text-forest-950 sm:text-[52px] lg:text-[58px]">
              Let&apos;s talk about your plants.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-[14px] leading-relaxed text-forest-800/80">
              Order questions, care worries, or a note about your delivery — one small team reads every message.
            </p>
          </div>
        </div>
      </section>

      {/* Form + direct lines */}
      <section className="container-shell py-12 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-forest-100/70 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forest-600">Write to us</p>
                <h2 className="display-title mt-2 text-[26px] font-semibold text-forest-950 sm:text-[30px]">
                  Tell us what you need.
                </h2>
              </div>
              <span className="hidden pb-1 text-[11px] text-forest-700/80 sm:block">Replies within one working day</span>
            </div>
            <ContactForm />
          </div>

          <aside>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forest-600">Direct lines</p>
            <div className="mt-4 divide-y divide-forest-100/80 border-y border-forest-100/80">
              {channels.map((channel) => (
                <ContactRow key={channel.label} {...channel} />
              ))}
            </div>

            <div className="mt-9">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-forest-600">
                <Clock className="h-3.5 w-3.5 text-forest-400" strokeWidth={1.7} aria-hidden />
                Studio hours
              </p>
              <dl className="mt-4 space-y-2.5 text-[12.5px]">
                {[
                  { day: "Monday – Friday", hours: "9:00 am – 6:00 pm" },
                  { day: "Saturday", hours: "10:00 am – 3:00 pm" },
                  { day: "Sunday", hours: "Closed" },
                ].map((row) => (
                  <div key={row.day} className="flex items-baseline justify-between gap-4">
                    <dt className="text-forest-700/80">{row.day}</dt>
                    <dd className={row.hours === "Closed" ? "text-forest-700/80" : "font-medium text-forest-900"}>
                      {row.hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-9 border-t border-forest-100/80 pt-6">
              <div className="flex gap-3">
                <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" strokeWidth={1.7} aria-hidden />
                <p className="text-[11.5px] leading-relaxed text-forest-700/80">
                  If your plant arrived damaged, write in as soon as you unbox it. A photo of the plant and packaging
                  helps us help you faster.
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-2.5 text-[12px] font-medium text-forest-800">
                <Link
                  href="/account/orders"
                  className="group inline-flex items-center justify-between gap-3 border-b border-forest-100/70 pb-2 transition hover:text-forest-950"
                >
                  Track an order
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-forest-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest-600"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/policies/returns"
                  className="group inline-flex items-center justify-between gap-3 border-b border-forest-100/70 pb-2 transition hover:text-forest-950"
                >
                  Returns policy
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-forest-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest-600"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-forest-100/70 bg-white/45">
        <div className="container-shell py-12 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forest-600">Before you write</p>
              <h2 className="display-title mt-3 text-balance text-[28px] font-semibold leading-tight text-forest-950 sm:text-[34px]">
                Quick answers, no back-and-forth.
              </h2>
              <p className="mt-4 max-w-sm text-[12.5px] leading-relaxed text-forest-700/80">
                The things we are asked most often. If your question is not here, the form above reaches a real person.
              </p>
            </div>
            <div className="border-t border-forest-100/80">
              {faqs.map((faq) => (
                <details key={faq.q} className="group border-b border-forest-100/80">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[13px] font-medium text-forest-950 [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <Plus
                      className="h-4 w-4 shrink-0 text-forest-400 transition duration-200 group-open:rotate-45"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                  </summary>
                  <p className="pb-5 pr-8 text-[12.5px] leading-relaxed text-forest-700/80">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
