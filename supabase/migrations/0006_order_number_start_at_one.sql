-- ---------------------------------------------------------------------------
-- 0006: the per-day order series starts at 001
--
-- Same format as 0004/0005 (ORD-YYYY-MM-DD-NNN) but the first order of each
-- day receives ORD-YYYY-MM-DD-001 instead of ORD-YYYY-MM-DD-000. The per-day
-- advisory lock and max-serial lookup still prevent duplicates under
-- concurrency. Run after 0001-0005.
-- ---------------------------------------------------------------------------
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

  -- Every valid delivery pincode is serviceable. A zone row only overrides the
  -- delivery charge for pincodes we have a specific rate for.
  select charge into v_zone_charge
  from public.delivery_zones where pincode = v_pincode;

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
  -- Human-friendly reference: ORD-YYYY-MM-DD-NNN (one running series per day,
  -- starting at 001). The no-serial default of 0 makes the first order 001.
  perform pg_advisory_xact_lock(hashtext('order-number:' || to_char(now(), 'YYYY-MM-DD')));
  v_order_number := 'ORD-' || to_char(now(), 'YYYY-MM-DD') || '-' || lpad((
    select coalesce(max((regexp_replace(o.order_number, '^ORD-\d{4}-\d{2}-\d{2}-', ''))::integer), 0) + 1
      from public.orders o
     where o.order_number ~ ('^ORD-' || to_char(now(), 'YYYY-MM-DD') || '-[0-9]+$')
  )::text, 3, '0');

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
