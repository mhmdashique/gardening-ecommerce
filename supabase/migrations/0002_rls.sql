-- Leaf & Pot — functions, triggers and row-level security.
-- Security model:
--   * anon can read the active storefront catalogue and marketing content;
--   * customers can read/write only their own rows;
--   * admins are identified by public.is_admin() and can manage everything;
--   * the service-role key is used by server actions/API routes only and bypasses RLS.
-- New signups are always customers. Promote the first admin manually (see README).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_blocked = false
  );
$$;

create or replace function public.setting_text(p_key text, p_default text default null)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value #>> '{}' from public.site_settings where key = p_key), p_default);
$$;

create or replace function public.setting_num(p_key text, p_default numeric default 0)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif((select value #>> '{}' from public.site_settings where key = p_key), '')::numeric,
    p_default
  );
$$;

create or replace function public.setting_bool(p_key text, p_default boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif((select value #>> '{}' from public.site_settings where key = p_key), '')::boolean,
    p_default
  );
$$;

-- ---------------------------------------------------------------------------
-- Profile creation and field protection
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Plant Lover'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A customer may edit their own name/phone/avatar, but never role, block state,
-- loyalty balance or email. Service-role and admins can change everything.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('leafandpot.allow_loyalty_write', true), '') = 'on' then
    return new;
  end if;
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  new.is_blocked := old.is_blocked;
  new.loyalty_points := old.loyalty_points;
  new.email := old.email;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- place_order: authoritative pricing, stock and coupon validation
-- ---------------------------------------------------------------------------

drop function if exists public.place_order(uuid, jsonb, jsonb, text, text, text);

create or replace function public.place_order(
  p_user_id uuid,
  p_items jsonb,
  p_address jsonb,
  p_payment_method text,
  p_coupon_code text default null,
  p_notes text default null,
  p_loyalty_points integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_row record;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_loyalty_discount numeric := 0;
  v_after numeric := 0;
  v_delivery numeric := 0;
  v_gst numeric := 0;
  v_total numeric := 0;
  v_loyalty integer := 0;
  v_loyalty_used integer := 0;
  v_loyalty_requested integer := 0;
  v_loyalty_balance integer := 0;
  v_redeem_rate numeric := 0;
  v_gst_percent numeric := 0;
  v_free_threshold numeric := 0;
  v_default_delivery numeric := 0;
  v_pincode text;
  v_zone_serviceable boolean;
  v_zone_charge numeric;
  v_coupon public.coupons%rowtype;
  v_has_coupon boolean := false;
  v_coupon_code text;
  v_order_count integer := 0;
  v_eligible numeric := 0;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_payment_status text;
begin
  -- The profile trigger protects loyalty balances from direct customer writes.
  -- This transaction-local flag lets trusted SECURITY DEFINER functions move points.
  perform set_config('leafandpot.allow_loyalty_write', 'on', true);

  if auth.role() is distinct from 'service_role' then
    if auth.uid() is null or auth.uid() <> p_user_id then
      raise exception 'You can only place your own orders.';
    end if;
    if exists (select 1 from public.profiles where id = auth.uid() and is_blocked) then
      raise exception 'ACCOUNT_BLOCKED: This account is unavailable.';
    end if;
  end if;

  if p_payment_method not in ('online', 'cod') then
    raise exception 'Choose a valid payment method.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty.';
  end if;

  if p_address is null or jsonb_typeof(p_address) <> 'object' then
    raise exception 'A delivery address is required.';
  end if;
  v_pincode := coalesce(p_address ->> 'pincode', '');
  if v_pincode !~ '^[1-9][0-9]{5}$' then
    raise exception 'Enter a valid 6-digit delivery pincode.';
  end if;

  drop table if exists _lp_items;
  create temporary table _lp_items (
    variant_id uuid,
    qty integer,
    price numeric,
    category_id uuid,
    name text,
    slug text,
    sku text,
    image text,
    size text,
    pot_type text
  ) on commit drop;

  for v_item in
    select variant_id, sum(qty)::integer as qty
    from jsonb_to_recordset(p_items) as x(variant_id uuid, qty integer)
    group by variant_id
  loop
    if v_item.variant_id is null or v_item.qty is null or v_item.qty < 1 or v_item.qty > 20 then
      raise exception 'One of the quantities is invalid.';
    end if;

    select
      pv.id,
      pv.price,
      pv.stock,
      pv.sku,
      pv.size,
      pv.pot_type,
      pv.is_active as variant_active,
      p.id as product_id,
      p.name,
      p.slug,
      p.category_id,
      p.is_active as product_active,
      (select pi.url from public.product_images pi
        where pi.product_id = p.id order by pi.sort_order limit 1) as image
    into v_row
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id
    for update of pv;

    if not found then
      raise exception 'OUT_OF_STOCK: One of the items in your bag is no longer available.';
    end if;
    if not v_row.product_active or not v_row.variant_active then
      raise exception 'OUT_OF_STOCK: % is no longer available.', v_row.name;
    end if;
    if v_row.stock < v_item.qty then
      raise exception 'OUT_OF_STOCK: % (%) only has % left.', v_row.name, v_row.size, v_row.stock;
    end if;

    v_subtotal := v_subtotal + (v_row.price * v_item.qty);

    insert into _lp_items (variant_id, qty, price, category_id, name, slug, sku, image, size, pot_type)
    values (v_row.id, v_item.qty, v_row.price, v_row.category_id, v_row.name, v_row.slug, v_row.sku,
            v_row.image, v_row.size, v_row.pot_type);
  end loop;

  -- Coupon validation and discount (server-authoritative).
  v_coupon_code := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  if v_coupon_code is not null then
    select * into v_coupon from public.coupons where code = v_coupon_code for update;
    if not found then
      raise exception 'COUPON: That coupon code is not valid.';
    end if;
    if not v_coupon.is_active then
      raise exception 'COUPON: This coupon is no longer active.';
    end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'COUPON: This coupon is not active yet.';
    end if;
    if v_coupon.ends_at is not null and v_coupon.ends_at < now() then
      raise exception 'COUPON: This coupon has expired.';
    end if;
    if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then
      raise exception 'COUPON: This coupon has reached its usage limit.';
    end if;
    if v_subtotal < v_coupon.min_order then
      raise exception 'COUPON: Add % more to use %.', ceil(v_coupon.min_order - v_subtotal), v_coupon.code;
    end if;

    select count(*) into v_order_count from public.orders where user_id = p_user_id;
    if v_coupon.first_order_only and v_order_count > 0 then
      raise exception 'COUPON: This coupon is valid on your first order only.';
    end if;

    if v_coupon.applies_to = 'category' and v_coupon.category_id is not null then
      select coalesce(sum(price * qty), 0) into v_eligible
      from _lp_items where category_id = v_coupon.category_id;
      if v_eligible <= 0 then
        raise exception 'COUPON: This coupon does not apply to the items in your bag.';
      end if;
    else
      v_eligible := v_subtotal;
    end if;

    if v_coupon.type = 'percent' then
      v_discount := round(v_eligible * v_coupon.value / 100);
    else
      v_discount := v_coupon.value;
    end if;
    if v_coupon.max_discount is not null then
      v_discount := least(v_discount, v_coupon.max_discount);
    end if;
    v_discount := greatest(0, least(v_discount, v_subtotal));
    v_has_coupon := true;
  end if;

  v_after := greatest(0, v_subtotal - v_discount);

  -- Loyalty redemption is validated against the stored balance and the amount
  -- still payable. At least ₹1 must remain due so online payments stay valid.
  v_loyalty_requested := greatest(0, coalesce(p_loyalty_points, 0));
  if v_loyalty_requested > 0 then
    if public.setting_num('loyalty_earn_rate', 0) <= 0
       or public.setting_num('loyalty_redeem_rate', 0) <= 0 then
      raise exception 'LOYALTY: Leaf points cannot be used right now.';
    end if;

    select loyalty_points into v_loyalty_balance
    from public.profiles where id = p_user_id for update;

    if v_loyalty_balance is null or v_loyalty_balance < v_loyalty_requested then
      raise exception 'LOYALTY: You do not have enough Leaf points for this redemption.';
    end if;

    v_redeem_rate := public.setting_num('loyalty_redeem_rate', 0);
    v_loyalty_discount := least(
      floor(v_loyalty_requested * 100 / v_redeem_rate),
      greatest(0, v_after - 1)
    );

    if v_loyalty_discount > 0 then
      v_loyalty_used := least(
        v_loyalty_requested,
        ceil(v_loyalty_discount * v_redeem_rate / 100)::integer
      );
      v_after := v_after - v_loyalty_discount;
    else
      v_loyalty_used := 0;
      v_loyalty_discount := 0;
    end if;
  end if;

  select is_serviceable, charge into v_zone_serviceable, v_zone_charge
  from public.delivery_zones where pincode = v_pincode;
  if found and v_zone_serviceable = false then
    raise exception 'NOT_SERVICEABLE';
  end if;

  v_free_threshold := public.setting_num('free_shipping_threshold', 999);
  v_default_delivery := public.setting_num('delivery_charge', 79);
  if v_after >= v_free_threshold then
    v_delivery := 0;
  else
    v_delivery := coalesce(v_zone_charge, v_default_delivery);
  end if;

  v_gst_percent := public.setting_num('gst_percent', 5);
  v_gst := round(v_after * v_gst_percent / (100 + v_gst_percent));
  v_total := v_after + v_delivery;

  if public.setting_num('loyalty_earn_rate', 0) > 0 and public.setting_num('loyalty_redeem_rate', 0) > 0 then
    v_loyalty := floor(v_after / 100) * public.setting_num('loyalty_earn_rate', 0)::integer;
  end if;

  v_payment_status := case when p_payment_method = 'cod' then 'cod_pending' else 'pending' end;
  v_order_number := 'LP' || to_char(now(), 'YYMM') || lpad(nextval('public.order_number_seq')::text, 3, '0');

  insert into public.orders (
    id, order_number, user_id, status, payment_method, payment_status,
    subtotal, discount, loyalty_discount, delivery_charge, gst, total,
    loyalty_points_earned, loyalty_points_used, address, coupon_code, notes, invoice_number
  ) values (
    v_order_id, v_order_number, p_user_id, 'processing', p_payment_method, v_payment_status,
    v_subtotal, v_discount, v_loyalty_discount, v_delivery, v_gst, v_total,
    v_loyalty, v_loyalty_used, p_address, case when v_has_coupon then v_coupon_code else null end,
    nullif(trim(coalesce(p_notes, '')), ''), 'INV-' || v_order_number
  );

  for v_row in select * from _lp_items loop
    insert into public.order_items (
      order_id, variant_id, product_id, name, slug, sku, image, size, pot_type, price, qty
    ) values (
      v_order_id, v_row.variant_id,
      (select product_id from public.product_variants where id = v_row.variant_id),
      v_row.name, v_row.slug, v_row.sku, v_row.image, v_row.size, v_row.pot_type, v_row.price, v_row.qty
    );
    update public.product_variants set stock = stock - v_row.qty where id = v_row.variant_id;
  end loop;

  if v_has_coupon then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  if v_loyalty_used > 0 then
    update public.profiles
      set loyalty_points = greatest(0, loyalty_points - v_loyalty_used)
      where id = p_user_id;

    insert into public.loyalty_transactions (user_id, order_id, points, type, note)
    values (p_user_id, v_order_id, -v_loyalty_used, 'redeemed',
            'Redeemed on ' || v_order_number);
  end if;

  insert into public.order_status_history (order_id, status, note, changed_by)
  values (v_order_id, 'processing', 'Order placed successfully.', 'system');

  insert into public.notifications (user_id, type, title, body)
  values (p_user_id, 'order', 'Order confirmed',
    v_order_number || ' is confirmed. We''ll let you know as soon as your plants are packed.');

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'loyalty_discount', v_loyalty_discount,
    'loyalty_points_used', v_loyalty_used,
    'delivery_charge', v_delivery,
    'gst', v_gst,
    'total', v_total
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_order: restores stock, coupon usage and loyalty
-- ---------------------------------------------------------------------------

create or replace function public.cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_is_privileged boolean := auth.role() = 'service_role' or public.is_admin();
begin
  perform set_config('leafandpot.allow_loyalty_write', 'on', true);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if not v_is_privileged and v_order.user_id is distinct from auth.uid() then
    raise exception 'You can only cancel your own order.';
  end if;
  if v_order.status = 'cancelled' then
    return jsonb_build_object('ok', true, 'already_cancelled', true);
  end if;
  if not v_is_privileged and v_order.status not in ('processing', 'packed') then
    raise exception 'This order can no longer be cancelled — it is already on its way.';
  end if;

  for v_item in select * from public.order_items where order_id = p_order_id loop
    if v_item.variant_id is not null then
      update public.product_variants set stock = stock + v_item.qty where id = v_item.variant_id;
    end if;
  end loop;

  if v_order.coupon_code is not null then
    update public.coupons set used_count = greatest(0, used_count - 1) where code = v_order.coupon_code;
  end if;

  if v_order.loyalty_points_used > 0
     and not exists (
       select 1 from public.loyalty_transactions
       where order_id = p_order_id and type = 'adjusted'
         and points = v_order.loyalty_points_used
     ) then
    insert into public.loyalty_transactions (user_id, order_id, points, type, note)
    values (v_order.user_id, p_order_id, v_order.loyalty_points_used, 'adjusted',
            'Points returned after cancellation of ' || v_order.order_number);
    update public.profiles
      set loyalty_points = loyalty_points + v_order.loyalty_points_used
      where id = v_order.user_id;
  end if;

  if v_order.loyalty_points_earned > 0
     and not exists (
       select 1 from public.loyalty_transactions
       where order_id = p_order_id and type = 'adjusted' and points < 0
     ) then
    insert into public.loyalty_transactions (user_id, order_id, points, type, note)
    values (v_order.user_id, p_order_id, -v_order.loyalty_points_earned, 'adjusted',
            'Reversed after cancellation of ' || v_order.order_number);
    update public.profiles
      set loyalty_points = greatest(0, loyalty_points - v_order.loyalty_points_earned)
      where id = v_order.user_id;
  end if;

  update public.orders
    set status = 'cancelled',
        payment_status = case when payment_status = 'paid' then 'refunded' else payment_status end
    where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, changed_by)
  values (p_order_id, 'cancelled',
          case when v_is_privileged then 'Cancelled by the store team.' else 'Cancelled by customer before dispatch.' end,
          case when v_is_privileged then 'admin' else 'customer' end);

  insert into public.notifications (user_id, type, title, body)
  values (v_order.user_id, 'order', 'Order cancelled',
    v_order.order_number || ' has been cancelled. Any online payment is refunded within 5–7 business days.');

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- award_loyalty: idempotent, paid orders only
-- ---------------------------------------------------------------------------

create or replace function public.award_loyalty(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found or v_order.payment_status <> 'paid' or v_order.loyalty_points_earned <= 0 then
    return false;
  end if;
  if exists (select 1 from public.loyalty_transactions where order_id = p_order_id and type = 'earned') then
    return false;
  end if;
  if public.setting_num('loyalty_earn_rate', 0) <= 0 or public.setting_num('loyalty_redeem_rate', 0) <= 0 then
    return false;
  end if;

  insert into public.loyalty_transactions (user_id, order_id, points, type, note)
  values (v_order.user_id, p_order_id, v_order.loyalty_points_earned, 'earned',
          'Earned on ' || v_order.order_number);

  update public.profiles
    set loyalty_points = loyalty_points + v_order.loyalty_points_earned
    where id = v_order.user_id;

  return true;
end;
$$;

revoke all on function public.place_order(uuid, jsonb, jsonb, text, text, text, integer) from public;
grant execute on function public.place_order(uuid, jsonb, jsonb, text, text, text, integer) to authenticated, service_role;
revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated, service_role;
revoke all on function public.award_loyalty(uuid) from public;
grant execute on function public.award_loyalty(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.banners enable row level security;
alter table public.coupons enable row level security;
alter table public.site_settings enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.return_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.loyalty_transactions enable row level security;

-- Profiles -------------------------------------------------------------------

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Catalogue ------------------------------------------------------------------

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (is_active = true or public.is_admin());

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
  for select using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_variants.product_id and p.is_active = true)
  );

drop policy if exists "variants_admin_write" on public.product_variants;
create policy "variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "images_public_read" on public.product_images;
create policy "images_public_read" on public.product_images
  for select using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_images.product_id and p.is_active = true)
  );

drop policy if exists "images_admin_write" on public.product_images;
create policy "images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- Marketing ------------------------------------------------------------------

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners
  for select using (
    public.is_admin()
    or (is_active = true
        and (starts_at is null or starts_at <= now())
        and (ends_at is null or ends_at >= now()))
  );

drop policy if exists "banners_admin_write" on public.banners;
create policy "banners_admin_write" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "coupons_public_read" on public.coupons;
create policy "coupons_public_read" on public.coupons
  for select using (public.is_admin() or is_active = true);

drop policy if exists "coupons_admin_write" on public.coupons;
create policy "coupons_admin_write" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "zones_public_read" on public.delivery_zones;
create policy "zones_public_read" on public.delivery_zones
  for select using (true);

drop policy if exists "zones_admin_write" on public.delivery_zones;
create policy "zones_admin_write" on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

-- Customer-owned tables ------------------------------------------------------

drop policy if exists "addresses_own" on public.addresses;
create policy "addresses_own" on public.addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "wishlists_own" on public.wishlists;
create policy "wishlists_own" on public.wishlists
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "recently_viewed_own" on public.recently_viewed;
create policy "recently_viewed_own" on public.recently_viewed
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "carts_own" on public.carts;
create policy "carts_own" on public.carts
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "cart_items_own" on public.cart_items;
create policy "cart_items_own" on public.cart_items
  for all using (
    public.is_admin()
    or exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

-- Orders ---------------------------------------------------------------------

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_history_select_own_or_admin" on public.order_status_history;
create policy "order_history_select_own_or_admin" on public.order_status_history
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_status_history.order_id and o.user_id = auth.uid())
  );

-- Payments: no anon/customer policies. Server code uses the service-role key.
drop policy if exists "payments_admin_read" on public.payments;
create policy "payments_admin_read" on public.payments
  for select using (public.is_admin());

drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- Reviews --------------------------------------------------------------------

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (is_approved = true or user_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'delivered'
    )
  );

drop policy if exists "reviews_admin_write" on public.reviews;
create policy "reviews_admin_write" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- Returns --------------------------------------------------------------------

drop policy if exists "returns_select_own_or_admin" on public.return_requests;
create policy "returns_select_own_or_admin" on public.return_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "returns_insert_own" on public.return_requests;
create policy "returns_insert_own" on public.return_requests
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'delivered'
    )
  );

drop policy if exists "returns_admin_update" on public.return_requests;
create policy "returns_admin_update" on public.return_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- Notifications --------------------------------------------------------------

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications
  for insert with check (user_id = auth.uid() or public.is_admin());

-- Loyalty --------------------------------------------------------------------

drop policy if exists "loyalty_select_own_or_admin" on public.loyalty_transactions;
create policy "loyalty_select_own_or_admin" on public.loyalty_transactions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "loyalty_admin_write" on public.loyalty_transactions;
create policy "loyalty_admin_write" on public.loyalty_transactions
  for all using (public.is_admin()) with check (public.is_admin());
