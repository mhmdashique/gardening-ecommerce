import Link from "next/link";
import { Facebook, Instagram, Leaf, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Brand } from "@/components/brand";
import { getCategories, getSettings } from "@/lib/catalog";

export async function SiteFooter() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="container-shell py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
              Thoughtfully grown plants, hand-finished pots and honest advice — everything you need to grow a greener
              home.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: Instagram, label: "Instagram" },
                { icon: Facebook, label: "Facebook" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-forest-700 transition hover:border-forest-300 hover:bg-leaf-mint"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-900">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className="transition hover:text-forest-900">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="font-medium text-forest-800 hover:underline">
                  View all plants
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-900">Help</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              <li><Link href="/contact" className="transition hover:text-forest-900">Contact us</Link></li>
              <li><Link href="/policies/shipping" className="transition hover:text-forest-900">Shipping & delivery</Link></li>
              <li><Link href="/policies/returns" className="transition hover:text-forest-900">Returns & replacements</Link></li>
              <li><Link href="/policies/privacy" className="transition hover:text-forest-900">Privacy policy</Link></li>
              <li><Link href="/policies/terms" className="transition hover:text-forest-900">Terms of service</Link></li>
              <li><Link href="/about#care" className="transition hover:text-forest-900">Plant care support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-900">Say hello</h3>
            <ul className="mt-4 space-y-3 text-[13px] text-muted">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" />
                <span>{settings.store_address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-forest-500" />
                <a href={`mailto:${settings.store_email}`} className="hover:text-forest-900">{settings.store_email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-forest-500" />
                <a href={`tel:${settings.store_phone.replace(/\s+/g, "")}`} className="hover:text-forest-900">{settings.store_phone}</a>
              </li>
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-leaf-mint px-3 py-2.5">
              <Leaf className="h-4 w-4 text-forest-600" />
              <p className="text-[11px] leading-tight text-forest-800">
                Free plant care support on every order, for as long as your plant needs it.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Leaf &amp; Pot. Green Home. Happy You.</p>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold">UPI</span>
            <span className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold">VISA</span>
            <span className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold">Mastercard</span>
            <span className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold">Rupay</span>
            <span className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
