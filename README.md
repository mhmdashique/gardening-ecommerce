# Leaf & Pot

**Green Home. Happy You.**

A complete single-store plant e-commerce application built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, Cashfree and Resend.

Leaf & Pot sells indoor plants, outdoor plants, succulents, pots and garden accessories, with a storefront, a customer account area and a full admin console. Prices, discounts, stock, coupons, loyalty settings and marketing copy are all server-authoritative and stored in the database.

---

## Contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [How demo mode works](#how-demo-mode-works)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Cashfree payment setup](#cashfree-payment-setup)
- [Resend setup](#resend-setup)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Business rules](#business-rules)
- [Security model](#security-model)
- [SEO and accessibility](#seo-and-accessibility)
- [Manual test checklist](#manual-test-checklist)
- [Known limitations](#known-limitations)

---

## Quick start

Requirements:

- Node.js 20 or newer (Node 22 recommended)
- npm 10 or newer

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

No environment variables are required to explore the app. With no Supabase
credentials it runs in **local demo mode** using an in-memory database seeded
with the full catalogue, sample orders, customers, reviews, coupons and banners.

Before deploying, run the checks:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

> Demo mode stores data in memory. Orders, stock changes and profile edits reset
> whenever the server process restarts.

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `priya@example.com` | `demo1234` |
| Admin | `admin@leafandpot.in` | `demo1234` |

These accounts exist only in demo mode. They are also listed on the login screen
while demo mode is active.

Demo mode also seeds:

- 22 products across 6 categories, with 36 variants and product images
- 3 coupons: `WELCOME20`, `INDOOR15`, `GREEN100`
- 8 sample orders for the seeded customers
- Approved reviews, notifications and loyalty transactions
- 7 delivery-zone pincodes and 6 marketing banners

---

## How demo mode works

The app selects its data layer at runtime:

| Configuration | Behaviour |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` **and** `NEXT_PUBLIC_SUPABASE_ANON_KEY` set | Supabase auth and Postgres |
| Either value missing | Local demo mode |

In demo mode:

- Auth uses a signed, HTTP-only `leaf_pot_demo_session` cookie (HMAC-SHA256,
  signed with `DEMO_SESSION_SECRET`).
- Data lives in a `globalThis` store so it survives Next.js hot reloads within a
  server process.
- Online payment at checkout is simulated and the order is marked paid
  immediately. This only happens when Cashfree is not configured.
- Emails are logged to the server console instead of being sent.
- Uploads in the admin console accept the existing image URL fields; there is no
  file-storage integration.

Use demo mode for UI review and end-to-end click-through testing. Use Supabase
for anything that needs persistence, real accounts, RLS or real payments.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in only the services you need.
Every variable is optional in demo mode.

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key, used by the browser and SSR clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for admin writes. Bypasses RLS, never expose it |
| `CASHFREE_APP_ID` | For online payments | Cashfree app id (Merchant Dashboard → API keys) |
| `CASHFREE_SECRET_KEY` | For online payments | Server-side secret used to verify payments and sign webhooks |
| `CASHFREE_API_KEY` | No | Optional legacy client key; App ID + Secret are sufficient |
| `NEXT_PUBLIC_CASHFREE_API_KEY` | No | Optional legacy public copy of the API key |
| `CASHFREE_ENV` | For online payments | `sandbox` (default) or `production` (case-insensitive) |
| `CASHFREE_WEBHOOK_SECRET` | For webhooks | Optional explicit secret for the Cashfree webhook |
| `RESEND_API_KEY` | For email | Resend API key |
| `EMAIL_FROM` | For email | Verified sender, e.g. `Leaf & Pot <orders@leafandpot.in>` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL, no trailing slash |
| `DEMO_SESSION_SECRET` | No | Cookie-signing secret for demo mode only |

`NEXT_PUBLIC_*` values are embedded in the client bundle. Never put a secret in
one.

For production, set `NEXT_PUBLIC_SITE_URL` to the real origin (for example
`https://leafandpot.in`). It is used in metadata, sitemap entries, auth redirects
and email links.

---

## Supabase setup

### 1. Create the project

Create a project at <https://supabase.com>, then copy the project URL, anon key
and service-role key into `.env.local`.

### 2. Run the migrations

The SQL files are in `supabase/migrations` and must be run **in order**:

1. `0001_schema.sql` — tables, indexes, sequences, updated-at triggers.
2. `0002_rls.sql` — helper functions, `place_order`, `cancel_order`,
   `award_loyalty`, profile trigger, RLS policies and grants.
3. `0003_seed.sql` — store settings, 6 categories, 22 products, 36 variants,
   24 images, 6 banners, 3 coupons and 7 delivery zones.

You can paste each file into the Supabase SQL editor, or use the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Seed data is insert-only (`on conflict do nothing` / `not exists`), so re-running
`0003_seed.sql` will not overwrite admin edits or live stock counts.

### 3. Configure Auth

In **Authentication → URL Configuration**:

- **Site URL:** your production URL, or `http://localhost:3000` locally.
- **Redirect URLs:** add
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://your-domain.com/reset-password`

Email/password auth works out of the box. If you enable Google, add the provider
credentials in Supabase and the same callback URL. Phone OTP requires an SMS
provider configured in Supabase.

### 4. Create the first admin

New signups are **always** created as `customer`. There is no self-service
promotion and no admin registration page.

1. Register a normal account through `/register`.
2. Confirm the email if confirmation is enabled.
3. In the Supabase SQL editor, promote that account once:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

4. Sign out and sign back in, then open `/admin`.

To demote an admin:

```sql
update public.profiles
set role = 'customer'
where email = 'you@example.com';
```

### 5. Verify RLS

RLS is enabled on every table in `0002_rls.sql`. The important guarantees:

- Customers can read and update only their own profile, addresses, cart,
  wishlist, notifications, loyalty transactions and orders.
- Orders and order items can be read by their owner; writes go through the
  `place_order` / `cancel_order` RPCs, not direct client inserts.
- Public users can read active products, categories, images, variants, approved
  reviews, active banners and settings.
- Admin-only operations are additionally guarded by `public.is_admin()` and by
  `requireAdmin()` in the app; admin server actions use the service-role key.
- `profiles.role` cannot be changed by a customer through the API; a trigger
  prevents self-promotion and profile changes to protected fields.

The service-role key is used only in server code (`lib/supabase/admin.ts`) and is
never imported into a client component.

---

## Cashfree payment setup

1. Create a Cashfree merchant account and generate API keys (App ID and Secret
   Key). `CASHFREE_API_KEY` is optional and only kept for older deployments.
2. Add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` to `.env.local`. Leave
   `CASHFREE_ENV` unset for sandbox; set it to `production` when going live.
   Set `NEXT_PUBLIC_SITE_URL` to the deployed `https://` origin and redeploy
   after changing environment variables.
3. Add a webhook in the Cashfree **Merchant Dashboard → Webhooks**:
   - **URL:** `https://your-domain.com/api/webhooks/cashfree`
   - **API version:** `2023-08-01`
   - **Events:** `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`, `ORDER_PAID`

The payment flow:

1. Checkout posts the cart to `/api/checkout`.
2. The server reloads variants, validates stock, coupons and totals, creates the
   order and a Cashfree order, and returns the payment session id.
3. The Cashfree Lite JS SDK (`sdk.cashfree.com/js/v3/cashfree.js`) opens the
   drop-in checkout in a popup modal on "Pay ₹X".
4. After the widget resolves, `/api/payments/verify` re-checks the payment
   against Cashfree's own `/pg/orders/{id}/payments` records before marking the
   order paid — client callbacks are never trusted directly.
5. `/api/webhooks/cashfree` verifies `x-webhook-signature`
   (HMAC-SHA256 of `x-webhook-timestamp + rawBody`, base64-encoded) before
   processing. Payment marking is idempotent, so browser verification and the
   webhook can both arrive without double-awarding loyalty.

Online payment is disabled automatically when Cashfree is not configured; COD
remains available according to the `cod_enabled` setting. In demo mode an online
order is simulated as paid so the flow can be tested without keys.

Always test with Cashfree sandbox keys before going live. The webhook secret is
the PG client secret unless you configure a separate one.

---

## Resend setup

1. Create a Resend account and verify your sending domain.
2. Add `RESEND_API_KEY` and set `EMAIL_FROM` to a verified address.
3. Transactional emails are sent for order confirmation, status updates,
   cancellation and password-related flows where applicable.

Without a key, email sending is skipped and a redacted line is written to the
server log. The app never fails an order because email delivery failed.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint via `next lint` |
| `npm run typecheck` | Run `tsc --noEmit` |

`next lint` is deprecated upstream but remains wired for Next 15. It is clean at
the time of writing.

---

## Project structure

```text
app/
  (shop)/                 Storefront: home, shop, category, search, product,
                          cart, wishlist, checkout, success
  (auth)/                 Login, register, forgot password, reset password
  account/                Customer dashboard, orders, tracking, addresses,
                          wishlist, profile, settings, notifications, loyalty
  admin/                  Dashboard, products, categories, orders, returns,
                          customers, reviews, coupons, banners, settings
  api/                    Checkout, payments, webhook, cart sync, coupons,
                          pincode, search, invoices, labels, CSV export
  policies/[slug]/        Shipping, returns, privacy and terms
  about/, contact/        Marketing and support pages
components/               UI, shells, forms, cart, checkout and admin widgets
lib/
  actions/                Server actions (auth, account, admin)
  supabase/               Browser, server and service-role clients
  catalog.ts              Catalogue, settings and order read layer
  orders.ts               Order creation, payment and cancellation logic
  pricing.ts              Coupon, GST, delivery and loyalty calculations
  demo-data.ts            Seed data for demo mode
  demo-store.ts           In-memory demo database
  demo-session.ts         Signed demo cookie
  validation.ts           Zod schemas
supabase/migrations/      Schema, RLS/RPCs and seed SQL
middleware.ts             Authentication gate for protected routes
```

---

## Routes

### Public storefront

- `/` — home with hero carousel, categories, featured and best sellers
- `/shop` — all products with filters, sorting and pagination
- `/category/[slug]` — category listing
- `/search?q=` — search results
- `/product/[slug]` — gallery, variants, stock, reviews, care details
- `/cart` — local cart, works without an account
- `/wishlist` — saved products (account-aware)
- `/about`, `/contact`
- `/policies/shipping`, `/policies/returns`, `/policies/privacy`,
  `/policies/terms`
- `/login`, `/register`, `/forgot-password`, `/reset-password`

### Customer account (login required)

- `/account` — dashboard
- `/account/orders`, `/account/orders/[id]`, `/account/orders/[id]/track`
- `/account/addresses`
- `/account/wishlist`
- `/account/profile`, `/account/settings`
- `/account/notifications`
- `/account/loyalty` (link hidden while loyalty is disabled)

### Checkout (login required)

- `/checkout`
- `/checkout/success?order=...`

### Admin (login + `admin` role required)

- `/admin` — revenue, orders, low stock and recent activity
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]`
- `/admin/categories`
- `/admin/orders`, `/admin/orders/[id]`
- `/admin/returns`
- `/admin/customers`
- `/admin/reviews`
- `/admin/coupons`
- `/admin/banners`
- `/admin/settings`

A signed-in customer who opens `/admin` is redirected to `/forbidden` (HTTP 403
page), never into a redirect loop.

---

## Business rules

### Currency and GST

- All money is stored and displayed as integer rupees (INR).
- GST is **inclusive**: `gst = round((subtotal - discount) * percent / (100 + percent))`.
- The order total is `(subtotal - discount) + delivery_charge`; GST is shown as a
  breakup, not added on top.
- The default rate is 5% and lives in `site_settings.gst_percent`.

### Delivery

- `site_settings.free_shipping_threshold` controls free shipping (default ₹999).
- `site_settings.delivery_charge` is the fallback charge (default ₹49).
- A matching `delivery_zones` row can override the charge and estimate by
  pincode. Unknown but valid pincodes use the standard charge.
- Every pincode is delivered (no unserviceable pincodes); zone rows never block
  an order.
- Delivery is free once the post-discount subtotal meets the threshold.

### Coupons

Coupons support percentage or flat discounts, minimum order value, maximum
discount, category restriction, first-order-only, start/end dates and usage
limits. Validation happens on the server at checkout; the browser preview is
advisory only. A successful order increments `used_count` and records the code on
the order.

Seeded coupons:

| Code | Type | Value | Minimum | Notes |
| --- | --- | --- | --- | --- |
| `WELCOME20` | Percent | 20% | ₹499 | Max ₹300, first order only |
| `INDOOR15` | Percent | 15% | ₹699 | Max ₹250, indoor plants only |
| `GREEN100` | Flat | ₹100 | ₹999 | — |

### Loyalty

Loyalty is **seeded disabled** with `loyalty_earn_rate = 0` and
`loyalty_redeem_rate = 0`. `getSettings()` treats loyalty as enabled only when
both rates are greater than zero, and the account navigation hides the loyalty
page until then. See `ASSUMPTIONS.md`.

When enabled, earning and redemption are calculated server-side, recorded in
`loyalty_transactions`, and reversed when an order is cancelled. Checkout applies
the customer's available balance after coupon discounts. At least ₹1 always stays
payable. Earned points are awarded when an online payment succeeds or a COD order
is marked delivered; redeemed points are reserved when the order is placed.

The seed keeps loyalty off, so the feature is dormant until an admin sets both
rates above zero and enables it.

### Orders and stock

- Prices, variants, stock and coupons are re-read on the server at checkout.
- Stock is decremented inside a locked transaction (`place_order` RPC in
  Supabase; synchronous demo store logic locally).
- Order numbers use `ORD-{yyyy}-{mm}-{dd}-{sequence}` (for example
  `ORD-2026-10-24-000`), with a fresh running series each day.
- Customers can cancel eligible orders; cancellation restores stock, releases
  coupon usage, reverses loyalty and marks a paid order refunded in demo mode.
- Admin status changes add a timeline entry and send a status email when Resend
  is configured. Delivering an order awards loyalty if enabled.
- Returns are requested per order item with a reason and optional photo URLs,
  then approved, rejected, replaced or refunded by an admin.

### Roles

- `customer` — storefront, checkout and own account data.
- `admin` — everything above plus `/admin`.
- New signups are always `customer`.
- Blocked accounts are redirected to `/blocked` and cannot check out.

---

## Security model

- Server-authoritative pricing, discounts, stock, delivery and loyalty.
- Cashfree payment signature verification with timing-safe comparison.
- Webhook signature verification against the raw body; idempotent payment
  marking.
- RLS enabled on every table, with security-definer RPCs for order placement and
  cancellation.
- Service-role key used only on the server.
- Admin checks in the middleware (authentication), the admin layout and every
  admin page/action (`requireAdmin`) for defence in depth.
- Zod validation for auth, checkout, account and admin inputs.
- Rate limiting on checkout, coupon validation, pincode lookup, payment verification/retry and auth actions.
- Security headers (`X-Frame-Options`, `nosniff`, referrer policy, permissions
  policy) and `poweredByHeader: false`.
- Passwords are never stored by the app; Supabase Auth handles hashing.
- Demo session cookies are HTTP-only, SameSite=Lax, and signed with HMAC-SHA256.

---

## SEO and accessibility

- Per-page metadata, canonicals, Open Graph and Twitter cards.
- `app/sitemap.ts` and `app/robots.ts`; account, admin, checkout and auth pages
  are marked `noindex`.
- Product structured data (JSON-LD) on product pages.
- Next Image with remote patterns for Unsplash and Supabase storage, plus a local
  SVG placeholder fallback.
- Semantic landmarks, skip link, visible focus states, labelled form controls,
  keyboard-friendly dialogs and carousels.
- Body text targets WCAG AA contrast (4.5:1) on the cream and green palette.
- Mobile-first layouts tested from 360px, with responsive navigation, tables and
  checkout.

---

## Manual test checklist

Demo mode covers the full happy path:

1. `/` loads hero banners, categories and products.
2. Log in as `priya@example.com`; the header shows the account menu.
3. Open a product, change size and quantity, add to cart.
4. `/cart` updates quantities; `/checkout` shows saved addresses, delivery
   estimate, GST and total.
5. Apply `WELCOME20`; the discount is recalculated server-side.
6. Place an online order; demo mode simulates payment and shows
   `/checkout/success`.
7. `/account/orders` lists the new order; the detail page shows the timeline.
8. Log out, log in as `admin@leafandpot.in`.
9. `/admin` shows live stats; `/admin/orders/[id]` can change status, add
   tracking, cancel and download invoice/label PDFs.
10. Cancel the test order; stock returns and a paid order becomes refunded.
11. Log back in as the customer and open `/admin`; you land on `/forbidden`.
12. Visit `/sitemap.xml`, `/robots.txt`, `/policies/shipping` and a missing URL
    (404 page).

For production, repeat with real Supabase accounts and Cashfree test keys, and
confirm that the webhook is received and processed once.

---

## Known limitations

- **Demo data is in memory.** Restarting the server resets orders, stock and
  profile changes.
- **Production Supabase mode is untested against a live project.** Migrations
  0001–0003 are provided but have not been executed here; run them in a staging
  project first.
- **No local Supabase instance** is configured, so RLS and RPC behaviour must be
  verified on a real project.
- **Next.js 15.5.28** is used (patched for the known 15.5.4 advisory). `npm
  audit` still reports advisories in build-time dependencies (Tailwind 3 /
  PostCSS) whose suggested fixes require Next 16 or Tailwind 4; no critical
  issues are reported. See `PROGRESS.md`.
- **Invoices use `Rs.`** instead of `₹` because the built-in PDF font (Helvetica)
  lacks the rupee glyph. The web UI uses `₹`.
- **No payment refunds API call.** Cancelling a paid order marks it refunded in
  the app; issuing the actual Cashfree refund remains a manual step.
- **No file uploads.** Product images, return photos and banners accept URLs.
- **Guest checkout is not supported.** Browsing and cart work without an account;
  checkout requires login.
- **Loyalty is disabled by default.** Enable it deliberately by setting both
  rates in Admin → Settings.

---

## License

Private project. All product names, copy and imagery are for demonstration.
Unsplash images are used under the Unsplash license; replace them with licensed
store photography before launch.
