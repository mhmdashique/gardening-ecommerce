-- Leaf & Pot — seed data
-- Run after 0001_schema.sql and 0002_rls.sql.
-- Safe to re-run: catalog, marketing and settings rows are inserted only when absent,
-- so admin edits and live stock counts are never overwritten.

begin;

-- ---------------------------------------------------------------------------
-- Store settings (marketing copy, thresholds and policy values live here)
-- ---------------------------------------------------------------------------

insert into public.site_settings (key, value) values
  ('store_name', '"Leaf & Pot"'::jsonb),
  ('store_tagline', '"Green Home. Happy You."'::jsonb),
  ('store_email', '"hello@leafandpot.in"'::jsonb),
  ('store_phone', '"+91 80 4718 2200"'::jsonb),
  ('store_address', '"42, Green Avenue, Indiranagar, Bengaluru 560038"'::jsonb),
  ('gst_number', '"29ABCDE1234F1Z5"'::jsonb),
  ('free_shipping_threshold', '999'::jsonb),
  ('delivery_charge', '49'::jsonb),
  ('gst_percent', '5'::jsonb),
  ('return_window_days', '7'::jsonb),
  ('claim_window_hours', '48'::jsonb),
  ('loyalty_earn_rate', '0'::jsonb),
  ('loyalty_redeem_rate', '0'::jsonb),
  ('cod_enabled', 'true'::jsonb),
  ('online_payment_enabled', 'true'::jsonb),
  ('low_stock_threshold', '5'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Categories (Using local images and matching real catalog)
-- ---------------------------------------------------------------------------

insert into public.categories
  (name, slug, description, image_url, icon, parent_id, sort_order, is_active)
values
  ('Indoor Plants', 'indoor-plants', 'Calm, green companions for your living room, bedroom and desk.', '/images/chinese evergreen.png', 'Leaf', null, 1, true),
  ('Succulents & Herbs', 'succulents', 'Hardy healing plants and soothing succulents that love sunlight.', '/images/aloevera plant.png', 'Sprout', null, 2, true),
  ('Air Purifiers', 'air-purifiers', 'NASA-backed natural filters that purify indoor toxic air.', '/images/paathi pull.jpg', 'Wind', null, 3, true),
  ('Lucky & Festive', 'lucky-plants', 'Auspicious greens bringing prosperity, positive Vastu, and harmony.', '/images/lucky bamboo.jpg', 'Sparkles', null, 4, true),
  ('Exotic Foliage', 'calathea-foliage', 'Dramatic collector prayer plants with velvety textures and vivid tones.', '/images/calathea plant.jpg', 'Heart', null, 5, true),
  ('Palms & Outdoor', 'palms', 'Grand structural statement fronds for sunny balconies and verandas.', '/images/palm.jpg', 'Sun', null, 6, true),
  ('Best Sellers', 'best-sellers', 'The highest rated live plants loved by thousands of plant parents.', '/images/paathi pull.jpg', 'Award', null, 7, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Products (7 Real Plant Species from local images with real Indian market pricing)
-- ---------------------------------------------------------------------------

insert into public.products
  (name, slug, description, short_description, category_id, badge, is_active,
   is_best_seller, light, water, difficulty, pet_friendly, air_purifying,
   care_guide, rating, review_count, created_at)
select seed.* from (values
  ('Peace Lily (Paathi Pull)', 'peace-lily', 'Quietly elegant white blooms and deep lush green leaves. The Peace Lily (often loved locally as Paathi Pull) tells you exactly when it needs hydration with a gentle nod, then quickly revives with water. Scientifically proven by NASA clean air studies to remove household toxins like benzene and formaldehyde.', 'Elegant white blooms with glossy air-purifying foliage. Classic Indian home favorite known for low maintenance and natural indoor air filtration.', (select id from public.categories where slug = 'indoor-plants'), 'Best Seller'::text, true, true, 'Medium', 'Medium', 'Easy', false, true, 'Keep soil evenly moist but never waterlogged. Thrives in medium, indirect light. Wipe broad leaves monthly to clear dust and mist occasionally for optimal flowering.', 4.8, 142, now() - interval '60 days'),
  ('Chinese Evergreen (Aglaonema)', 'chinese-evergreen', 'Aglaonema (Chinese Evergreen) is celebrated for its silvery patterns and unmatched tolerance for indoor shade, dim bedrooms, and air-conditioned office rooms. It stores moisture in its thick stems, making it ideal for busy plant parents.', 'Silvery-green variegated leaves that flourish under low light and air-conditioned spaces. Exceptional resilience.', (select id from public.categories where slug = 'indoor-plants'), 'Popular'::text, true, true, 'Low', 'Low', 'Easy', false, true, 'Allow top 2 inches of soil to dry out between waterings. Tolerates dim corners and fluorescent lighting. Avoid cold drafts and do not overwater.', 4.9, 88, now() - interval '58 days'),
  ('Aloe Vera Plant', 'aloe-vera', 'The quintessential Indian home herbal plant. Thick fleshy spears filled with soothing pure aloe gel used for skin hydration, minor kitchen burns, and natural haircare. Thrives on sun-drenched balconies and south-facing windowsills with minimal watering.', 'Medicinal succulent with cooling gel. Drought tolerant and thrives in bright, sunny windowsills.', (select id from public.categories where slug = 'succulents'), 'Best Seller'::text, true, true, 'Bright', 'Low', 'Easy', false, true, 'Water only when soil is bone dry, approximately once every 10–14 days. Needs 4+ hours of direct or filtered sunlight. Always use gritty, fast-draining cactus soil.', 4.7, 210, now() - interval '55 days'),
  ('Lucky Bamboo (3-Tier)', 'lucky-bamboo', 'Arranged carefully in traditional 3-tier harmony, Dracaena sanderiana is renowned in Vastu and Feng Shui for attracting happiness, wealth, and vibrant vitality into your living room and workplace. Comes ready to display in clear clean water with pebbles.', 'Symbol of prosperity, wealth, and positive Feng Shui. Grows effortlessly in water or decorative glass.', (select id from public.categories where slug = 'lucky-plants'), 'Popular'::text, true, true, 'Medium', 'Medium', 'Easy', false, true, 'Change water completely once every 7 to 10 days using RO or distilled water. Keep in indirect bright to medium light. Never place in harsh direct midday sun.', 4.8, 175, now() - interval '50 days'),
  ('Calathea Lutea (Cigar Plant)', 'calathea-lutea', 'Calathea Lutea (also known as the Cuban Cigar or Havana plant) produces magnificent upright paddle-like leaves with silvery waxy undersides. A prized interior styling specimen that creates an instant tropical oasis indoors or in sheltered verandas.', 'Architectural paddle foliage with silvery-white undersides. Dramatic tropical indoor statement.', (select id from public.categories where slug = 'calathea-foliage'), 'New'::text, true, false, 'Bright', 'Medium', 'Moderate', true, true, 'Loves bright, indirect ambient light and elevated humidity. Keep soil evenly moist using filtered water to prevent leaf tip browning. Mist foliage regularly.', 4.6, 62, now() - interval '45 days'),
  ('Ruffled Fan Palm (Licuala)', 'fan-palm', 'Licuala Grandis (Ruffled Fan Palm) is one of the most stunning palms in the botanical world. Features accordion-pleated circular fronds that unfold like royal origami fans. Perfect for bright entryways, living rooms, and sheltered verandahs.', 'Rare circular pleated fronds reminiscent of hand fans. Spectacular luxury patio and indoor centerpiece.', (select id from public.categories where slug = 'palms'), 'New'::text, true, false, 'Bright', 'Medium', 'Moderate', true, true, 'Prefers generous bright filtered light without direct scorching sun. Water thoroughly when top inch is dry. Protect from chilly AC drafts and maintain gentle humidity.', 4.9, 45, now() - interval '40 days'),
  ('Red Calathea (Velvet Rufibarba)', 'red-calathea', 'Calathea Rufibarba, celebrated as the Furry Feather or Velvet Calathea, captivates with elongated lance leaves clothed in soft fuzzy textures and deep maroon-purple undersides. Foliage folds upwards gracefully each evening in true prayer plant fashion.', 'Velvety undulating green leaves with deep burgundy-red undersides. Dynamic prayer plant movement.', (select id from public.categories where slug = 'calathea-foliage'), 'Popular'::text, true, false, 'Medium', 'Medium', 'Moderate', true, true, 'Keep in medium to low indirect light. Water when the top inch of soil feels dry, preferably with dechlorinated or RO water. Keep away from direct afternoon sun.', 4.7, 53, now() - interval '35 days')
) as seed(name, slug, description, short_description, category_id, badge, is_active,
          is_best_seller, light, water, difficulty, pet_friendly, air_purifying,
          care_guide, rating, review_count, created_at)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Product images (Local verified image assets)
-- ---------------------------------------------------------------------------

insert into public.product_images (product_id, url, sort_order)
select p.id, seed.url, seed.sort_order
from (values
  ('peace-lily', '/images/paathi pull.jpg', 0),
  ('chinese-evergreen', '/images/chinese evergreen.png', 0),
  ('aloe-vera', '/images/aloevera plant.png', 0),
  ('lucky-bamboo', '/images/lucky bamboo.jpg', 0),
  ('calathea-lutea', '/images/calathea plant.jpg', 0),
  ('fan-palm', '/images/palm.jpg', 0),
  ('red-calathea', '/images/red calathea.jpg', 0)
) as seed(slug, url, sort_order)
join public.products p on p.slug = seed.slug
where not exists (
  select 1 from public.product_images i
  where i.product_id = p.id and i.url = seed.url
);

-- ---------------------------------------------------------------------------
-- Product variants (Real Indian Nursery Market Pricing benchmarks)
-- ---------------------------------------------------------------------------

insert into public.product_variants
  (product_id, sku, size, pot_type, price, compare_at_price, stock,
   low_stock_threshold, is_active)
select p.id, seed.sku, seed.size, seed.pot_type, seed.price, seed.compare_at_price,
       seed.stock, seed.low_stock_threshold, seed.is_active
from (values
  ('peace-lily', 'LP-P1-1', 'Pot', '6" Nursery Pot (100% Price)', 299, 399, 30, 5, true),
  ('peace-lily', 'LP-P1-2', 'With Plastic Cover', 'Nursery Grow Bag (80% Price)', 239, 319, 25, 5, true),
  ('peace-lily', 'LP-P1-3', 'Without Pot', 'Bare Root / Root Ball (75% Price)', 224, 299, 20, 5, true),
  ('peace-lily', 'LP-P1-4', 'Cuttings', 'Fresh Rooted Cutting (50% Price)', 149, 199, 35, 5, true),
  ('chinese-evergreen', 'LP-P2-1', 'Pot', '6" Nursery Pot (100% Price)', 399, 499, 25, 5, true),
  ('chinese-evergreen', 'LP-P2-2', 'With Plastic Cover', 'Nursery Grow Bag (80% Price)', 319, 399, 20, 5, true),
  ('chinese-evergreen', 'LP-P2-3', 'Without Pot', 'Bare Root / Root Ball (75% Price)', 299, 374, 18, 5, true),
  ('chinese-evergreen', 'LP-P2-4', 'Cuttings', 'Fresh Rooted Cutting (50% Price)', 199, 249, 30, 5, true),
  ('aloe-vera', 'LP-P3-1', 'Small', '4" Nursery Pot', 199, 249, 50, 5, true),
  ('aloe-vera', 'LP-P3-2', 'Medium', '6" Terracotta Planter', 349, 449, 22, 5, true),
  ('lucky-bamboo', 'LP-P4-1', 'Pot', 'Ceramic Planter Bowl (100% Price)', 299, 399, 30, 5, true),
  ('lucky-bamboo', 'LP-P4-2', 'With Plastic Cover', 'Protective Sleeve Wrap (80% Price)', 239, 319, 25, 5, true),
  ('lucky-bamboo', 'LP-P4-3', 'Without Pot', 'Bare Stalks Bundle (75% Price)', 224, 299, 20, 5, true),
  ('lucky-bamboo', 'LP-P4-4', 'Cuttings', 'Individual Fresh Stalks (50% Price)', 149, 199, 35, 5, true),
  ('calathea-lutea', 'LP-P5-1', 'Pot', '6" Nursery Pot (100% Price)', 549, 699, 15, 5, true),
  ('calathea-lutea', 'LP-P5-2', 'With Plastic Cover', 'Nursery Grow Bag (80% Price)', 439, 559, 15, 5, true),
  ('calathea-lutea', 'LP-P5-3', 'Without Pot', 'Bare Root / Root Ball (75% Price)', 412, 524, 12, 5, true),
  ('calathea-lutea', 'LP-P5-4', 'Cuttings', 'Rooted Stem Cutting (50% Price)', 275, 349, 20, 5, true),
  ('fan-palm', 'LP-P6-1', 'Pot', '7" Nursery Pot (100% Price)', 599, 749, 12, 5, true),
  ('fan-palm', 'LP-P6-2', 'With Plastic Cover', 'Nursery Grow Bag (80% Price)', 479, 599, 14, 5, true),
  ('fan-palm', 'LP-P6-3', 'Without Pot', 'Bare Root / Root Ball (75% Price)', 449, 562, 10, 5, true),
  ('fan-palm', 'LP-P6-4', 'Cuttings', 'Rooted Frond Cutting (50% Price)', 299, 374, 15, 5, true),
  ('red-calathea', 'LP-P7-1', 'Pot', '5" Nursery Pot (100% Price)', 449, 549, 18, 5, true),
  ('red-calathea', 'LP-P7-2', 'With Plastic Cover', 'Nursery Grow Bag (80% Price)', 359, 439, 16, 5, true),
  ('red-calathea', 'LP-P7-3', 'Without Pot', 'Bare Root / Root Ball (75% Price)', 337, 412, 14, 5, true),
  ('red-calathea', 'LP-P7-4', 'Cuttings', 'Fresh Rooted Cutting (50% Price)', 225, 275, 25, 5, true)
) as seed(slug, sku, size, pot_type, price, compare_at_price, stock,
          low_stock_threshold, is_active)
join public.products p on p.slug = seed.slug
on conflict (sku) do nothing;

-- ---------------------------------------------------------------------------
-- Banners (Using authentic local plant imagery)
-- ---------------------------------------------------------------------------

insert into public.banners
  (placement, title, subtitle, eyebrow, image_url, cta_label, cta_url,
   is_active, sort_order)
select seed.* from (values
  ('hero', 'Authentic Living Greens Directly to Your Doorstep', 'Hand-nurtured botanical collection of resilient indoor plants, air purifiers, and exotic foliage.', 'Real Plants. Real Growth.', '/images/landing.png', 'Shop Live Plants', '/shop', true, 1),
  ('hero', 'Calm Shade & Clean Living Spaces', 'From serene Chinese Evergreens to refreshing Peace Lilies — elevate your home with natural air filtration.', 'Shade & Pure Air', '/images/chinese evergreen.png', 'Explore Indoor Plants', '/category/indoor-plants', true, 2),
  ('hero', 'Medicinal & Auspicious Plant Companions', 'Bring wellness and fortune home with Aloe Vera and Lucky Bamboo arrangements.', 'Wellness & Fortune', '/images/aloevera plant.png', 'Shop Succulents & Herbs', '/category/succulents', true, 3),
  ('offer', 'Get 20% Off on your first order', 'Use code WELCOME20 at checkout. Every home deserves living vitality.', 'New here?', '/images/lucky bamboo.jpg', 'Shop Now', '/shop', true, 1),
  ('special_offer', 'Exclusive 15% Off on Exotic Foliage', 'Use code INDOOR15 to acquire rare Calatheas and Fan Palms this season.', 'Limited Batch', '/images/palm.jpg', 'Explore Exotics', '/category/calathea-foliage', true, 1),
  ('dashboard_promo', 'Care For Your Plant Family', 'Expert soil, watering, and lighting guidance for all your botanical companions.', 'Leaf & Pot Care', '/images/calathea plant.jpg', 'Read Guides', '/care-guide', true, 1)
) as seed(placement, title, subtitle, eyebrow, image_url, cta_label, cta_url,
          is_active, sort_order)
where not exists (
  select 1 from public.banners b
  where b.placement = seed.placement and b.title = seed.title
);

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------

insert into public.coupons
  (code, description, type, value, min_order, max_discount, applies_to,
   category_id, first_order_only, usage_limit, used_count, is_active)
select seed.code, seed.description, seed.type, seed.value, seed.min_order,
       seed.max_discount, seed.applies_to,
       (select c.id from public.categories c where c.slug = seed.category_slug),
       seed.first_order_only, seed.usage_limit, 0, seed.is_active
from (values
  ('WELCOME20', '20% off your first order, up to ₹300.', 'percent', 20, 499, 300, 'all', null, true, null, true),
  ('INDOOR15', '15% off indoor plants, up to ₹250.', 'percent', 15, 699, 250, 'category', 'indoor-plants', false, 200, true),
  ('GREEN100', 'Flat ₹100 off orders above ₹999.', 'flat', 100, 999, null, 'all', null, false, 500, true)
) as seed(code, description, type, value, min_order, max_discount, applies_to,
          category_slug, first_order_only, usage_limit, is_active)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Delivery zones
-- ---------------------------------------------------------------------------

insert into public.delivery_zones (pincode, is_serviceable, charge, estimated_days) values
  ('560001', true, 49, 2),
  ('560038', true, 0, 1),
  ('560035', true, 49, 2),
  ('110001', true, 79, 4),
  ('400001', true, 69, 3),
  ('600001', true, 79, 4),
  ('700001', true, 89, 5)
on conflict (pincode) do nothing;

-- ---------------------------------------------------------------------------
-- First admin
-- ---------------------------------------------------------------------------
-- Sign up through /register first, then promote the account (once) with:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- New signups always start as customers; there is no self-service admin path.

commit;
