-- Leaf & Pot — schema
-- Run in the Supabase SQL editor (or via `supabase db push`) before deploying.
-- All money values are integer rupees. GST is inclusive and back-calculated by place_order().

create extension if not exists pgcrypto;

create sequence if not exists public.order_number_seq start with 231;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default 'Plant Lover',
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  is_blocked boolean not null default false,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  icon text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text,
  category_id uuid not null references public.categories(id) on delete restrict,
  badge text check (badge is null or badge in ('Popular', 'Best Seller', 'New')),
  is_active boolean not null default true,
  is_best_seller boolean not null default false,
  light text not null default 'Medium' check (light in ('Low', 'Medium', 'Bright', 'Full Sun')),
  water text not null default 'Medium' check (water in ('Low', 'Medium', 'High')),
  difficulty text not null default 'Easy' check (difficulty in ('Easy', 'Moderate', 'Expert')),
  pet_friendly boolean not null default false,
  air_purifying boolean not null default false,
  care_guide text,
  rating numeric(2, 1) not null default 4.7 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text not null,
  pot_type text not null,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Marketing
-- ---------------------------------------------------------------------------

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'hero'
    check (placement in ('hero', 'offer', 'special_offer', 'dashboard_promo')),
  title text not null,
  subtitle text,
  eyebrow text,
  image_url text,
  cta_label text,
  cta_url text,
  is_active boolean not null default true,
  sort_order integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  type text not null check (type in ('percent', 'flat')),
  value numeric(10, 2) not null check (value > 0),
  min_order numeric(10, 2) not null default 0 check (min_order >= 0),
  max_discount numeric(10, 2) check (max_discount is null or max_discount >= 0),
  applies_to text not null default 'all' check (applies_to in ('all', 'category')),
  category_id uuid references public.categories(id) on delete set null,
  first_order_only boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  pincode text primary key check (pincode ~ '^[1-9][0-9]{5}$'),
  is_serviceable boolean not null default true,
  charge numeric(10, 2) not null default 0 check (charge >= 0),
  estimated_days integer not null default 4 check (estimated_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.recently_viewed (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty integer not null check (qty > 0 and qty <= 20),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'processing'
    check (status in ('processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')),
  payment_method text not null check (payment_method in ('online', 'cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cod_pending')),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  loyalty_discount numeric(10, 2) not null default 0 check (loyalty_discount >= 0),
  delivery_charge numeric(10, 2) not null default 0 check (delivery_charge >= 0),
  gst numeric(10, 2) not null default 0 check (gst >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  loyalty_points_earned integer not null default 0 check (loyalty_points_earned >= 0),
  loyalty_points_used integer not null default 0 check (loyalty_points_used >= 0),
  address jsonb not null,
  coupon_code text,
  tracking_number text,
  courier text,
  notes text,
  invoice_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid,
  product_id uuid,
  name text not null,
  slug text,
  sku text not null,
  image text,
  size text,
  pot_type text,
  price numeric(10, 2) not null check (price >= 0),
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  gateway text not null default 'razorpay',
  gateway_order_id text,
  gateway_payment_id text,
  status text not null default 'created',
  amount numeric(10, 2),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null default 'Verified buyer',
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  photo_urls text[] not null default '{}',
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'replaced', 'refunded')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'order',
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  points integer not null,
  type text not null check (type in ('earned', 'redeemed', 'adjusted', 'expired')),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active, created_at desc);
create index if not exists product_variants_product_idx on public.product_variants(product_id);
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);
create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id, created_at);
create index if not exists payments_order_idx on public.payments(order_id);
create index if not exists reviews_product_idx on public.reviews(product_id, is_approved);
create index if not exists reviews_user_idx on public.reviews(user_id);
create index if not exists return_requests_status_idx on public.return_requests(status, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists loyalty_user_idx on public.loyalty_transactions(user_id, created_at desc);
create unique index if not exists loyalty_earned_once_idx
  on public.loyalty_transactions(order_id) where type = 'earned' and order_id is not null;
create unique index if not exists loyalty_reversal_once_idx
  on public.loyalty_transactions(order_id) where type = 'adjusted' and order_id is not null;
create index if not exists recently_viewed_user_idx on public.recently_viewed(user_id, viewed_at desc);
create index if not exists banners_placement_idx on public.banners(placement, sort_order);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists product_variants_updated_at on public.product_variants;
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

drop trigger if exists banners_updated_at on public.banners;
create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists delivery_zones_updated_at on public.delivery_zones;
create trigger delivery_zones_updated_at before update on public.delivery_zones
  for each row execute function public.set_updated_at();

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

drop trigger if exists carts_updated_at on public.carts;
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

drop trigger if exists return_requests_updated_at on public.return_requests;
create trigger return_requests_updated_at before update on public.return_requests
  for each row execute function public.set_updated_at();
