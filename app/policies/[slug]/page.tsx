import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, Leaf } from "lucide-react";
import { getSettings } from "@/lib/catalog";
import { formatINR } from "@/lib/utils";

type PolicySection = { heading: string; body: string[] };

const policyMeta = {
  shipping: {
    title: "Shipping & delivery",
    description: "Delivery charges, dispatch timelines and pincode serviceability for Leaf & Pot orders.",
  },
  returns: {
    title: "Returns & replacements",
    description: "Our damage cover, replacement process and refund timelines for plants and pots.",
  },
  privacy: {
    title: "Privacy policy",
    description: "What data Leaf & Pot collects, why we collect it and how you can control it.",
  },
  terms: {
    title: "Terms of service",
    description: "The terms that apply when you shop with Leaf & Pot.",
  },
} as const;

type PolicySlug = keyof typeof policyMeta;

const slugs = Object.keys(policyMeta) as PolicySlug[];

function buildSections(slug: PolicySlug, settings: Awaited<ReturnType<typeof getSettings>>): PolicySection[] {
  switch (slug) {
    case "shipping":
      return [
        {
          heading: "Dispatch timelines",
          body: [
            "Orders placed before 2:00 pm on a working day are usually packed the same day. Orders placed later, or on Sundays and public holidays, are packed on the next working day.",
            "Plants are living products. If the weather is too hot or too cold to move a particular plant safely, we may hold dispatch by a day and let you know.",
          ],
        },
        {
          heading: "Delivery charges",
          body: [
            `Standard delivery is ${formatINR(settings.delivery_charge)}. Orders above ${formatINR(settings.free_shipping_threshold)} ship free.`,
            "Some pincodes carry a different charge or timeline. The exact charge for your address is shown at checkout before payment.",
          ],
        },
        {
          heading: "Serviceable pincodes",
          body: [
            "We deliver to all pincodes across Kerala. Use the pincode checker on any product page to see the delivery estimate and charge for your area.",
            "If a courier cannot reach your address after dispatch, we will contact you to arrange an alternative. Repeated failed delivery attempts may incur a re-dispatch charge.",
          ],
        },
        {
          heading: "Tracking",
          body: [
            "Once your parcel is handed to the courier, the tracking number appears under My Orders and in your dispatch email. Tracking can take a few hours to activate.",
          ],
        },
      ];
    case "returns":
      return [
        {
          heading: "Damage cover",
          body: [
            `Report transit damage within ${settings.claim_window_hours} hours of delivery with photos of the plant, pot and packaging. We will review the photos and arrange a replacement or refund.`,
            "Minor leaf loss, a bent stem or loose soil can happen in transit and is usually not a defect. Send us a photo anyway — we will tell you honestly whether it needs action.",
          ],
        },
        {
          heading: "Return window",
          body: [
            `Unused pots and garden accessories can be returned within ${settings.return_window_days} days of delivery in their original packaging. Plants cannot be returned for a change of mind because they are living products.`,
            "Approved returns are collected by our courier where serviceable. Refunds are issued to the original payment method after inspection.",
          ],
        },
        {
          heading: "Refund timelines",
          body: [
            "Online payments are refunded within 5–7 business days of approval. Cash-on-delivery orders are refunded by bank transfer; we will ask for the account details securely.",
            "Delivery charges are refunded when the return is due to damage, a wrong item or a defect on our side.",
          ],
        },
        {
          heading: "How to start a return",
          body: [
            "Open the order under My Orders, choose the item and select Report a problem. Add a short description and up to three photos. You can track the decision in the same order view.",
          ],
        },
      ];
    case "privacy":
      return [
        {
          heading: "What we collect",
          body: [
            "Account details you provide (name, email, phone), delivery addresses, order history, reviews you write and messages you send to support.",
            "Payment card data is handled by our payment gateway. Leaf & Pot does not store full card numbers or UPI credentials.",
          ],
        },
        {
          heading: "Why we use it",
          body: [
            "To create and deliver orders, provide plant care support, prevent fraud, meet tax and accounting obligations, and improve the catalogue and store experience.",
            "We send transactional messages about orders and, only if you opt in, occasional care notes and offers. You can change marketing preferences in account settings.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Courier partners receive the name, address and phone number needed for delivery. Our payment gateway receives the amount and order reference needed to process payment.",
            "We do not sell personal data. Service providers are required to use it only for the service they provide to us.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            `You can update your profile and addresses in your account, or write to ${settings.store_email} to request a copy or deletion of your data. Some order records must be retained for tax and legal reasons.`,
          ],
        },
      ];
    case "terms":
      return [
        {
          heading: "Shopping with us",
          body: [
            "By placing an order you confirm that the details you provide are accurate and that you are able to enter into a contract of sale.",
            "Prices, offers and availability are shown on the storefront and may change. The price charged is the price confirmed at checkout.",
          ],
        },
        {
          heading: "Orders and payment",
          body: [
            "An order is accepted when we confirm it and, for online payments, when payment is captured. We may cancel an order if stock is unavailable, a pricing error occurred or fraud is suspected; any captured payment is refunded.",
            "Cash on delivery is available only where enabled and may be limited by order value or pincode.",
          ],
        },
        {
          heading: "Product descriptions",
          body: [
            "Plants are natural products. Leaf variegation, height, pot colour and exact leaf count vary between individual plants, and photographs are representative rather than exact.",
            "Care guidance is general advice, not a guarantee that a plant will thrive in every environment.",
          ],
        },
        {
          heading: "Liability and law",
          body: [
            "Our liability for an order is limited to the amount paid for that order, except where the law requires otherwise. Nothing in these terms limits rights you have under applicable consumer law.",
            "These terms are governed by the laws of India, and disputes are subject to the courts of Bengaluru, Karnataka.",
          ],
        },
        {
          heading: "Business details",
          body: [
            `${settings.store_name}, ${settings.store_address}. GSTIN: ${settings.gst_number}. Questions: ${settings.store_email} or ${settings.store_phone}.`,
          ],
        },
      ];
  }
}

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = policyMeta[slug as PolicySlug];
  if (!meta) return { title: "Policy not found" };
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugs.includes(slug as PolicySlug)) notFound();
  const typedSlug = slug as PolicySlug;
  const meta = policyMeta[typedSlug];
  const settings = await getSettings();
  const sections = buildSections(typedSlug, settings);

  return (
    <div className="container-shell py-8 sm:py-12">
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest-800">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span>Policies</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-forest-900">{meta.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="h-fit lg:sticky lg:top-[104px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Policies</p>
          <nav className="mt-2 grid gap-1" aria-label="Policy pages">
            {slugs.map((item) => (
              <Link
                key={item}
                href={`/policies/${item}`}
                aria-current={item === typedSlug ? "page" : undefined}
                className={
                  item === typedSlug
                    ? "rounded-xl bg-leaf-soft px-3 py-2 text-[12px] font-semibold text-forest-950"
                    : "rounded-xl px-3 py-2 text-[12px] text-muted transition hover:bg-leaf-mint hover:text-forest-900"
                }
              >
                {policyMeta[item].title}
              </Link>
            ))}
          </nav>
          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <Leaf className="h-4 w-4 text-forest-600" />
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Need help with a specific order? Write to{" "}
              <a href={`mailto:${settings.store_email}`} className="font-semibold text-forest-700 underline underline-offset-2">
                {settings.store_email}
              </a>
              .
            </p>
          </div>
        </aside>

        <article className="min-w-0">
          <p className="eyebrow flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" /> Last updated 23 October 2026
          </p>
          <h1 className="display-title mt-2 text-[30px] font-semibold leading-tight text-forest-950 sm:text-[38px]">
            {meta.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted">{meta.description}</p>

          <div className="mt-7 space-y-7">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-[19px] font-semibold text-forest-950">{section.heading}</h2>
                <div className="mt-2 space-y-2.5">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-[13px] leading-relaxed text-forest-900/80">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-9 rounded-2xl border border-line bg-leaf-mint/60 p-4 text-[12px] leading-relaxed text-forest-900">
            This page is a summary of how we operate. It does not replace your statutory consumer rights. For a
            question about a specific order, contact us with the order number.
          </div>
        </article>
      </div>
    </div>
  );
}
