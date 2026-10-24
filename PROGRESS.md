# Progress

**Project:** Leaf & Pot — single-store plant e-commerce
**Last updated:** 23 October 2026

---

## Status

| Area | Status |
| --- | --- |
| Application code | Complete |
| Demo mode | Complete and smoke-tested |
| Supabase schema + RLS + seed migrations | Written, not yet executed against Postgres |
| Storefront, customer and admin shells | Complete |
| Checkout, payments, webhook, invoices | Complete |
| Documentation | Complete (`README.md`, `.env.example`, `ASSUMPTIONS.md`) |
| Lint | Passing |
| Type check | Passing |
| Production build | Passing |
| Production deployment | Not done (requires Supabase/Razorpay/Resend credentials) |

---

## Build order and completion

### 1. Foundation

- [x] Next.js 15 App Router + TypeScript strict + Tailwind 3
- [x] Design tokens, typography, cream/green palette, shared UI primitives
- [x] Canonical types (`lib/types.ts`) and utilities (`lib/utils.ts`)
- [x] Validation schemas (`lib/validation.ts`)
- [x] Next config, security headers, image remote patterns
- [x] Global metadata, fonts, loading, error and 404 states

### 2. Data layer and demo environment

- [x] Seeded demo database with catalogue, settings, users, orders, reviews
- [x] Demo session signing and verification
- [x] Supabase browser, server and service-role clients
- [x] Runtime switch between Supabase and demo mode
- [x] Catalogue read layer with filters, sorting, pagination and search
- [x] Settings, banners, zones, coupons and order reads

### 3. Authentication and shells

- [x] Login, register, forgot password, reset password, auth callback
- [x] Email/password + Google entry point + phone OTP UI
- [x] Middleware authentication gate for `/checkout`, `/account/*`, `/admin/*`
- [x] Public storefront shell (header, footer, cart drawer, search)
- [x] Customer account shell and sidebar
- [x] Admin shell and navigation
- [x] Role checks (`requireAdmin`) in layout, pages and actions
- [x] `/forbidden`, `/blocked` and loop-free redirects
- [x] First-admin SQL documented; all signups default to `customer`

### 4. Storefront

- [x] Home: hero carousel, trust strip, categories, featured, best sellers,
      offers, recently viewed and dashboard promo for signed-in users
- [x] Shop with filters (category, light, water, difficulty, pet-friendly, price,
      availability), sorting and pagination
- [x] Category and search pages, search dialog and API
- [x] Product page: gallery, variants, stock, quantity, wishlist, reviews,
      care details and related products
- [x] Cart page and drawer backed by localStorage, with signed-in debounce sync
- [x] Wishlist page and toggle
- [x] About, contact, policy pages, footer care section

### 5. Checkout and payments

- [x] Checkout UI with saved/new address, zone estimate and coupon totals
- [x] Server-recomputed totals, stock, coupon and loyalty logic
- [x] Online (Razorpay) and COD paths
- [x] Razorpay order creation, signature verification and retry flow
- [x] Idempotent webhook for `payment.captured`, `order.paid`, `payment.failed`
- [x] Demo simulated payment when Razorpay is absent
- [x] Success page and pending-payment state
- [x] Invoice and shipping-label PDF routes
- [x] Order confirmation and status emails via Resend (best-effort)

### 6. Customer account

- [x] Dashboard with stats, recent orders, wishlist and promos
- [x] Order list, order detail, tracking timeline
- [x] Cancel, review, return request, pay-now for pending orders
- [x] Addresses CRUD and default address
- [x] Wishlist
- [x] Profile and settings (password, notifications, account)
- [x] Notifications with unread state
- [x] Loyalty page (hidden/disabled by default)

### 7. Admin console

- [x] Dashboard: revenue, order counts, low stock, recent orders, returns
- [x] Products: list, create, edit, variants, images, hide/archive
- [x] Categories: create, edit, reorder, activate
- [x] Orders: list/filter/search, detail, status timeline, tracking, cancel,
      refunds, CSV export, invoice/label downloads
- [x] Returns: approve, reject, replace, refund with notes
- [x] Customers: list, search, block/unblock, loyalty adjustments
- [x] Reviews: approve/reject
- [x] Coupons: create, edit, activate, usage limits
- [x] Banners: create, edit, placement and schedule
- [x] Settings: store details, shipping, GST, policies, payment toggles,
      loyalty rates

### 8. SEO, UX and accessibility

- [x] `sitemap.ts`, `robots.ts`, canonicals, Open Graph/Twitter metadata
- [x] Product JSON-LD
- [x] `noindex` on private routes
- [x] Mobile-first responsive layout from 360px
- [x] Loading, empty and error states
- [x] Keyboard-friendly dialogs/carousels, skip link, focus states, labels
- [x] AA contrast target and reduced-motion handling
- [x] Local SVG image fallback

### 9. Database migrations

- [x] `0001_schema.sql` — 22 tables, indexes, order sequence, updated-at triggers
- [x] `0002_rls.sql` — RLS on every table, profile protections, `place_order`,
      `cancel_order`, `award_loyalty`, grants
- [x] `0003_seed.sql` — settings (loyalty off), categories, 22 products,
      36 variants, 24 images, 6 banners, 3 coupons, 7 zones, first-admin note
- [ ] Execute `0001`–`0003` against a staging Supabase project
- [ ] Verify RLS and RPCs with real customer/admin sessions

### 10. Verification and handover

- [x] `npm run typecheck` — passes
- [x] `npm run lint` — passes with no warnings
- [x] `npm run build` — passes, 53 routes generated
- [x] Demo smoke test: home, shop, product, cart, checkout, success
- [x] Demo smoke test: customer account and order history
- [x] Demo smoke test: admin dashboard, order detail, cancellation/refund
- [x] Demo smoke test: customer blocked from `/admin` → `/forbidden`
- [x] Demo smoke test: policy pages, sitemap, robots
- [x] `README.md`, `.env.example`, `ASSUMPTIONS.md`
- [ ] Apply migrations and test production mode
- [ ] Configure Razorpay test keys and verify webhook delivery
- [ ] Configure Resend and verify sender domain
- [ ] Replace demo imagery and promotional copy with store-owned assets

---

## Verification log

| Date | Check | Result |
| --- | --- | --- |
| 23 Oct 2026 | `npm run typecheck` | Pass, no errors |
| 23 Oct 2026 | `npm run lint` | Pass, no warnings |
| 23 Oct 2026 | `npm run build` | Pass, 53 static/dynamic routes |
| 23 Oct 2026 | Demo mode HTTP smoke test | `/`, shop, product, cart, policies, sitemap, robots return 200; `/checkout`, `/account`, `/admin` redirect to login when signed out |
| 23 Oct 2026 | Customer checkout | Order `LP2610232` created, payment simulated, order visible in account and admin |
| 23 Oct 2026 | Admin cancellation | Order cancelled, payment marked refunded, Monstera stock restored |
| 23 Oct 2026 | Role gate | Signed-in customer opening `/admin` reached `/forbidden` with no redirect loop |

---

## Dependency note

- Upgraded `next` and `eslint-config-next` from `15.5.4` to `15.5.28` to address
  CVE-2025-66478.
- `npm audit fix` updated `sharp` to a patched release.
- Remaining `npm audit` findings (8 high, 3 moderate, 0 critical) are in
  build-time tooling:
  - Tailwind 3's `chokidar`/`fast-glob`/`micromatch`/`postcss-nested` chain.
    The suggested fix is Tailwind 4, a breaking styling migration.
  - Next's bundled `postcss`. The suggested fix is Next 16, a breaking framework
    upgrade.
- No critical advisories remain. Revisit the Next 16 and Tailwind 4 upgrades as a
  separate maintenance task.

---

## Remaining work before launch

1. Create a staging Supabase project and run migrations `0001`–`0003`.
2. Register an admin account, promote it with SQL, and verify `/admin`.
3. Verify RLS with a customer session (cannot read other orders/addresses, cannot
   change role or directly write orders).
4. Configure Razorpay test keys and a public webhook URL; place a test order and
   confirm exactly one paid transition and loyalty award.
5. Configure Resend with a verified domain and check confirmation/status emails.
6. Replace Unsplash seed images and sample copy with store-owned assets.
7. Run a final accessibility and responsive pass on real devices.
8. Re-run `npm run lint`, `npm run typecheck` and `npm run build` before deploy.

---

## Working notes

- Demo order numbers follow `ORD-{yyyy}-{mm}-{dd}-{sequence}` (starting at
  `000` each day).
- Demo admin is `u2` (`admin@leafandpot.in`); demo customer is `u1`
  (`priya@example.com`).
- The demo store lives on `globalThis.__leafAndPotDb` and resets on restart.
- Admin actions use the service-role client only after `requireAdmin()`.
- `lib/orders.ts` exports `releaseDemoOrder()` so customer and admin
  cancellations share stock/coupon/loyalty restoration.
- Invoice/label routes need the Node runtime and `pdf-lib`.
- `npm run lint` uses the deprecated `next lint`; it is still clean on Next 15.
