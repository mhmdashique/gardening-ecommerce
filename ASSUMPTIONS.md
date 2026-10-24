# Assumptions & Decisions

This document records the choices made where the brief left room for
interpretation, plus the constraints of the local environment. It is the
reference for why the implementation behaves the way it does.

---

## 1. Runtime modes

### 1.1 Demo mode is the default

**Assumption:** the site should be runnable and reviewable without paid or
external services.

**Decision:** when `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the app runs in local demo mode:

- A seeded in-memory database (`globalThis.__leafAndPotDb`) provides catalogue,
  settings, users, orders, reviews, coupons and zones.
- Auth uses a signed HTTP-only cookie instead of Supabase Auth.
- Demo credentials are shown on the login page.

The data resets when the server process restarts. Production behaviour requires
Supabase credentials.

### 1.2 Production requires Supabase

**Assumption:** Supabase is the system of record for production auth and data.

**Decision:** the data layer branches on `isSupabaseConfigured()`. All production
reads use the anon/server clients with RLS; admin writes use the service-role
client after `requireAdmin()`.

### 1.3 Demo online payments are simulated

**Assumption:** reviewers will test checkout without Cashfree keys.

**Decision:** if Cashfree is not configured, choosing online payment creates the
order and marks it paid immediately, and the success page states that payment was
simulated. With Cashfree configured, the real drop-in checkout, server-side
verification and webhook flow is used. COD is available independently, controlled
by `cod_enabled`.

---

## 2. Money, tax and pricing

### 2.1 Currency

All prices are integer Indian rupees (INR). There are no paise in the UI or
database money columns; Razorpay amounts are converted to paise at the API
boundary.

### 2.2 GST is inclusive

**Assumption:** Indian retail prices are normally displayed tax-inclusive.

**Decision:** GST is back-calculated and shown as a breakup:

```text
gst    = round((subtotal - discount) * gst_percent / (100 + gst_percent))
total  = (subtotal - discount) + delivery_charge
```

GST is **not** added on top of the total. The default rate is 5% and is stored in
`site_settings.gst_percent`.

### 2.3 Delivery charge and free shipping

- The free-shipping threshold and standard charge come from `site_settings`
  (`free_shipping_threshold`, `delivery_charge`), never from hard-coded UI copy.
- A matching `delivery_zones` row can override the charge and estimate.
- Every valid pincode is serviceable, including every Kerala pincode. A pincode
  with no zone row uses the standard charge with a 4-day estimate. Zone rows
  never block an order (`delivery_zones.is_serviceable` is informational only).
- Free shipping is evaluated on the post-discount subtotal.

### 2.4 Coupons

Coupons are validated twice: a preview endpoint for the checkout summary and a
final server-side validation inside order creation. Only the server result is
authoritative. Usage is counted when an order is successfully placed.

### 2.5 Refunds

Cancelling a paid order marks `payment_status = 'refunded'` and restores stock,
coupon usage and loyalty. No Razorpay refund API call is made; the actual refund
is an operational step outside the app.

---

## 3. Loyalty

### 3.1 Seeded disabled

**Assumption:** the brief asks for loyalty infrastructure but not a mandatory
live programme.

**Decision:** `loyalty_earn_rate` and `loyalty_redeem_rate` are both seeded at `0`.
`getSettings()` derives `loyalty_enabled` as `earn_rate > 0 && redeem_rate > 0`.
The account navigation and loyalty page only promote the programme when enabled.

Admins can enable it in **Admin → Settings** by setting both rates above zero.
When enabled, points are earned on delivered orders and can be redeemed at
checkout; both directions are recorded in `loyalty_transactions`.

### 3.2 Points maths

Points are earned as `floor(post_discount_subtotal / 100) * earn_rate`.
Redemption converts points at `floor(points * 100 / redeem_rate)` rupees, capped
by the customer's balance and the amount still payable. An order always keeps at
least ₹1 due, so a loyalty-covered online order can still be sent to Razorpay.
Redemption comes after any coupon discount, and both GST and the free-shipping
threshold are calculated on the amount after both discounts.

The client shows an estimate, but the server computes the authoritative amount.
In Supabase mode the `place_order` RPC locks the profile row, validates the
balance, deducts the points and writes a `redeemed` transaction atomically. In
demo mode the same rules run in `lib/pricing.ts` and `lib/orders.ts`.

Points earned are awarded when a paid order is confirmed (online) or marked
delivered (cash on delivery). Cancelling an order returns redeemed points and
reverses any points already earned. Both rates are read from the database, not
hard-coded.

---

## 4. Accounts, roles and access

### 4.1 New users are customers

Every signup is created as `customer`. There is no admin registration form or
self-service promotion. The first admin must be promoted with SQL, as documented
in `README.md` and at the end of `0003_seed.sql`.

### 4.2 Admin access

- Middleware handles authentication only and redirects unauthenticated users to
  `/login?next=...`.
- Admin layout, every admin page and every admin server action call
  `requireAdmin()`.
- A signed-in customer hitting `/admin` is redirected to `/forbidden`, a real 403
  page, rather than being sent back to login (which would loop).
- Blocked customers are redirected to `/blocked`.

### 4.3 Checkout requires login

Browsing, search, product pages, cart and wishlist are available without an
account. `/checkout`, `/account/*` and `/admin/*` are login-gated by middleware.
There is no guest checkout because orders, loyalty and order history are tied to
a profile.

### 4.4 Demo auth

Demo sessions use HMAC-SHA256 over a JSON payload in an HTTP-only cookie. The
secret is `DEMO_SESSION_SECRET` or a development fallback. This is suitable for
local review only; production uses Supabase Auth.

---

## 5. Catalogue and content

### 5.1 Single store, single currency, single language

The brief describes a single-store plant shop. There is no multi-vendor,
multi-currency or localisation layer. Copy is English (India) and currency is INR.

### 5.2 Marketing content lives in the database

Hero banners, offer banners, special offers, the dashboard promo, store details,
free-shipping threshold, delivery charge, GST, return window, claim window,
payment toggles and loyalty rates are all rows in `site_settings`, `banners` or
`delivery_zones`. The UI reads them through `getSettings()` / `getBanners()`.

Fallback values exist in `lib/demo-data.ts` so pages render if a settings row is
missing, but production seeds all keys.

### 5.3 Product imagery

**Assumption:** the project does not include a licensed photo library.

**Decision:** seed data uses Unsplash URLs, with `/images/plant-placeholder.svg`
as the fallback through `SafeImage`. Next Image remote patterns allow Unsplash,
Supabase storage and Cloudinary. Replace seed imagery with store photography
before launch.

### 5.4 Ratings and reviews

Products carry seeded `rating` and `review_count` values for a populated
storefront. Reviews are moderated in the admin console and only approved reviews
appear publicly. Each review stores a `customer_name` snapshot instead of
joining the reviewer's profile, so public review queries never expose email,
phone or loyalty data. Approving or removing a review recomputes the product's
rating and review count from approved reviews, so a production catalogue with no
approved reviews starts at zero once moderation begins.

### 5.5 Categories

Six categories are seeded: Indoor Plants, Outdoor Plants, Succulents, Pots &
Planters, Garden Accessories and Best Sellers. "Best Sellers" is a merchandising
collection; products also carry an `is_best_seller` flag used by the home page.

---

## 6. Orders, fulfilment and returns

### 6.1 Order lifecycle

Statuses: `processing → packed → shipped → delivered`, with `cancelled` and
`returned` as terminal states. Payment statuses: `pending`, `paid`, `failed`,
`refunded`, `cod_pending`.

### 6.2 Order numbers

Order numbers follow `ORD-{yyyy}-{mm}-{dd}-{sequence}` (for example
`ORD-2026-10-24-000`). Each day starts a new three-digit series; the number is
allocated inside `place_order` under a per-day advisory lock, so concurrent
checkouts cannot collide. Demo mode mirrors the format in memory.

### 6.3 Cancellation

Customers may cancel orders that have not shipped. Cancellation:

- restores variant stock,
- releases the coupon usage count,
- reverses loyalty earned/redeemed,
- marks a paid order refunded,
- appends a timeline entry and notification.

The Supabase path uses the `cancel_order` RPC; demo mode uses
`releaseDemoOrder()` so both customer and admin cancellations behave the same.

### 6.4 Returns

Returns are requested per order item with a reason and optional photo URLs, then
moderated by an admin (`requested → approved / rejected / replaced / refunded`).
The return window comes from `site_settings.return_window_days`. There is no
automated pickup or refund integration.

### 6.5 COD

COD is available when `site_settings.cod_enabled` is true. COD orders are created
with `payment_status = 'cod_pending'` and become paid when marked delivered.

### 6.6 Invoice and label PDFs

Invoice and shipping-label PDFs are generated server-side with `pdf-lib` and
streamed from API routes. Invoices use `Rs.` because the built-in Helvetica font
does not include the `₹` glyph.

---

## 7. Email and notifications

### 7.1 Email is best-effort

Resend is used for order confirmation, status updates and cancellation. If
`RESEND_API_KEY` is absent, sending is skipped and a redacted line is logged; an
order is never rolled back because email failed.

### 7.2 In-app notifications

Order events also create rows in `notifications`, which appear in
`/account/notifications`. The header shows an unread count.

---

## 8. Supabase schema and security

### 8.1 RLS everywhere

Every table has RLS enabled. Public read policies cover active catalogue and
marketing content. Customer policies are scoped to `auth.uid()`. Admin policies
use `public.is_admin()`.

### 8.2 RPCs

- `place_order(p_user_id, p_items, p_address, p_payment_method, p_coupon_code, p_notes, p_loyalty_points)`
  validates and locks variants, recomputes totals, applies the coupon, validates
  and deducts redeemed points under a profile row lock, decrements stock, writes
  the order/items/history/notification/loyalty transaction and returns JSONB.
- `cancel_order(p_order_id)` restores stock and coupon usage, returns redeemed
  points and reverses earned points. It is callable by the order owner, an admin
  or the service role.
- `award_loyalty(p_order_id)` awards earned points once when a paid order is
  delivered.

Security-definer functions set an explicit `search_path` and are granted only to
the roles that need them.

### 8.3 First admin

There is intentionally no seeded auth user and no default production password.
Create the account through `/register`, then run the promotion SQL. This avoids
shipping a known admin credential.

### 8.4 Migrations are not yet executed here

Migrations `0001`–`0003` were written and reviewed against the data layer, but
there is no local Supabase/Postgres instance in this environment. They must be
run against a staging project before production. See `PROGRESS.md`.

---

## 9. Framework and dependency choices

### 9.1 Next.js version

The project started on Next 15.5.4. Because that release is affected by
CVE-2025-66478, it was upgraded to **15.5.28**, the latest patched 15.x at the
time of writing. Remaining `npm audit` findings are in build-time dependencies
and require a Next 16 or Tailwind 4 major upgrade; there are no critical findings.

### 9.2 App Router and async APIs

The project uses the App Router with React Server Components and server actions.
In Next 15, `cookies()`, `headers()`, `params` and `searchParams` are awaited.

### 9.3 Styling

Tailwind CSS 3 with a custom cream/green design system in `tailwind.config.ts` and
`app/globals.css`. Components use `clsx` + `tailwind-merge`. No component library
is used.

### 9.4 Images

`SafeImage` wraps `next/image` and falls back to a local SVG if a remote image
fails. Remote patterns are restricted in `next.config.ts`.

### 9.5 PDFs

`pdf-lib` is used rather than a headless browser so invoice/label routes can run
on Node without extra system dependencies.

---

## 10. Accessibility and responsive assumptions

- Mobile-first from 360px; layouts were designed for small screens first.
- Body text uses the darker green/ink palette to target WCAG AA 4.5:1.
- Forms have visible labels, error text tied to inputs and keyboard-operable
  controls.
- The carousel and dialogs support keyboard use and expose labels; decorative
  images use empty alt text.
- Reduced-motion preferences are respected for non-essential animation.
- Admin tables become horizontally scrollable on small screens rather than
  hiding critical columns.

Formal WCAG audit with assistive technology was not possible in this environment;
the implementation follows the checklist but has not been third-party certified.

---

## 11. Out of scope

The following were not requested and are intentionally absent:

- Multi-vendor marketplace, multi-store or multi-currency
- Native mobile apps
- Real-time chat or a support ticketing system
- Automated refunds, pickup scheduling or courier integration
- Subscription/plant-care plans
- Blog/CMS beyond the seeded marketing content and policy pages
- File uploads to object storage
- Tax invoices with e-invoicing/IRN or GST filing integration
- Analytics, advertising pixels or consent-management platform

---

## 12. Environment notes

- Developed on Windows with Node.js and npm.
- The workspace is not a git repository, so no commit history is included.
- There is no local Supabase CLI project; migrations are plain SQL files under
  `supabase/migrations`.
- Demo mode is intentionally ephemeral; do not treat it as a database.
