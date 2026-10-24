import {
  demoProducts,
  demoCategories,
  demoBanners,
  demoCoupons,
  demoZones,
  demoSettings,
  demoReviews,
  buildDemoStats,
} from "@/lib/demo-data";
import { demoCategoryWithCount, getDb } from "@/lib/demo-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabaseReadOnly } from "@/lib/supabase/server";
import { minPrice } from "@/lib/product-utils";
import type {
  Address,
  Banner,
  BannerPlacement,
  Category,
  Coupon,
  DeliveryZone,
  Notification,
  Order,
  PagedProducts,
  Product,
  ProductFilters,
  ProductVariant,
  Review,
  SiteSettings,
  User,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Mapping helpers                                                            */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export function mapProductRow(row: Row): Product {
  const category = (row.categories ?? {}) as Row;
  const variants = ((row.product_variants ?? []) as Row[]).map((v) => ({
    id: String(v.id),
    product_id: String(v.product_id ?? row.id),
    sku: String(v.sku),
    size: String(v.size),
    pot_type: String(v.pot_type),
    price: Number(v.price),
    compare_at_price: v.compare_at_price === null ? null : Number(v.compare_at_price),
    stock: Number(v.stock),
    low_stock_threshold: Number(v.low_stock_threshold ?? 5),
    is_active: v.is_active !== false,
  })) satisfies ProductVariant[];
  const images = ((row.product_images ?? []) as Row[])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((image) => String(image.url))
    .filter(Boolean);
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    short_description: (row.short_description as string | null) ?? String(row.description ?? "").slice(0, 120),
    category_id: String(row.category_id ?? ""),
    category_name: String(category.name ?? row.category_name ?? "Plants"),
    category_slug: String(category.slug ?? row.category_slug ?? "plants"),
    badge: (row.badge as Product["badge"]) ?? null,
    is_active: row.is_active !== false,
    is_best_seller: Boolean(row.is_best_seller),
    light: (row.light as Product["light"]) ?? "Medium",
    water: (row.water as Product["water"]) ?? "Medium",
    difficulty: (row.difficulty as Product["difficulty"]) ?? "Easy",
    pet_friendly: Boolean(row.pet_friendly),
    air_purifying: Boolean(row.air_purifying),
    care_guide: (row.care_guide as string | null) ?? null,
    rating: Number(row.rating ?? 4.7),
    review_count: Number(row.review_count ?? 0),
    images: images.length ? images : ["/images/plant-placeholder.svg"],
    variants,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapOrderRow(row: Row): Order {
  const profile = (row.profiles ?? {}) as Row;
  const items = ((row.order_items ?? []) as Row[]).map((item) => ({
    id: String(item.id),
    order_id: String(item.order_id),
    variant_id: String(item.variant_id),
    product_id: String(item.product_id ?? ""),
    name: String(item.name),
    slug: String(item.slug ?? ""),
    sku: String(item.sku),
    image: String(item.image ?? "/images/plant-placeholder.svg"),
    size: String(item.size ?? ""),
    pot_type: String(item.pot_type ?? ""),
    price: Number(item.price),
    qty: Number(item.qty),
  }));
  const history = ((row.order_status_history ?? []) as Row[])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((entry) => ({
      id: String(entry.id),
      status: String(entry.status),
      note: (entry.note as string | null) ?? null,
      changed_by: (entry.changed_by as string | null) ?? null,
      created_at: String(entry.created_at),
    }));
  return {
    id: String(row.id),
    order_number: String(row.order_number),
    user_id: String(row.user_id),
    customer_name: String(profile.full_name ?? row.customer_name ?? "Customer"),
    customer_email: String(profile.email ?? row.customer_email ?? ""),
    status: row.status,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount ?? 0),
    loyalty_discount: Number(row.loyalty_discount ?? 0),
    delivery_charge: Number(row.delivery_charge ?? 0),
    gst: Number(row.gst ?? 0),
    total: Number(row.total),
    loyalty_points_earned: Number(row.loyalty_points_earned ?? 0),
    loyalty_points_used: Number(row.loyalty_points_used ?? 0),
    address: row.address ?? {
      name: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    },
    coupon_code: (row.coupon_code as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    courier: (row.courier as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
    items,
    status_history: history,
    invoice_number: (row.invoice_number as string | null) ?? `INV-${row.order_number}`,
  };
}

const productSelect = `*, categories(name, slug), product_variants(*), product_images(url, sort_order)`;
const orderSelect = `*, profiles(full_name, email), order_items(*), order_status_history(*)`;

/* -------------------------------------------------------------------------- */
/*  Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export async function getCategories(includeInactive = false): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    let query = supabase.from("categories").select("*").order("sort_order");
    if (!includeInactive) query = query.eq("is_active", true);
    const { data } = await query;
    const { data: products } = await supabase
      .from("products")
      .select("category_id, is_best_seller")
      .eq("is_active", true);
    return ((data ?? []) as Row[]).map((row) => {
      const count =
        row.slug === "best-sellers"
          ? (products ?? []).filter((p) => p.is_best_seller).length
          : (products ?? []).filter((p) => p.category_id === row.id).length;
      return {
        id: String(row.id),
        name: String(row.name),
        slug: String(row.slug),
        description: (row.description as string | null) ?? null,
        image_url: (row.image_url as string | null) ?? null,
        icon: (row.icon as string | null) ?? null,
        parent_id: (row.parent_id as string | null) ?? null,
        sort_order: Number(row.sort_order ?? 0),
        is_active: row.is_active !== false,
        product_count: count,
      };
    });
  }
  // Fallback: real plant categories with local images
  return demoCategories
    .filter((c) => includeInactive || c.is_active)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(demoCategoryWithCount);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("products")
      .select(productSelect)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map(mapProductRow);
  }
  // Fallback: 7 real plants with local images and real Indian market prices
  return demoProducts.filter((p) => p.is_active);
}

function matchesFilters(product: Product, filters: ProductFilters) {
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack =
      `${product.name} ${product.description} ${product.category_name} ${product.badge ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.category === "best-sellers") {
    if (!product.is_best_seller) return false;
  } else if (filters.category && product.category_slug !== filters.category) {
    return false;
  }
  const price = minPrice(product);
  if (typeof filters.minPrice === "number" && price < filters.minPrice) return false;
  if (typeof filters.maxPrice === "number" && price > filters.maxPrice) return false;
  if (filters.light && filters.light !== "all" && product.light !== filters.light) return false;
  if (filters.water && filters.water !== "all" && product.water !== filters.water) return false;
  if (filters.petFriendly && !product.pet_friendly) return false;
  if (filters.bestSeller && !product.is_best_seller) return false;
  if (filters.size && filters.size !== "all") {
    if (!product.variants.some((v) => v.size === filters.size && v.is_active)) return false;
  }
  return true;
}

export function sortProducts(products: Product[], sort?: string) {
  const list = products.slice();
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => minPrice(a) - minPrice(b));
    case "price-desc":
      return list.sort((a, b) => minPrice(b) - minPrice(a));
    case "newest":
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "rating":
      return list.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
    default:
      return list.sort(
        (a, b) =>
          Number(b.is_best_seller) - Number(a.is_best_seller) ||
          b.rating * b.review_count - a.rating * a.review_count,
      );
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<PagedProducts> {
  const all = await getAllProducts();
  const filtered = all.filter((p) => matchesFilters(p, filters));
  const sorted = sortProducts(filtered, filters.sort);
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, Math.max(1, filters.perPage ?? 12));
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  return {
    products: sorted.slice((page - 1) * perPage, page * perPage),
    total: sorted.length,
    page,
    perPage,
    totalPages,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return null;
    const { data } = await supabase
      .from("products")
      .select(productSelect)
      .eq("slug", slug)
      .maybeSingle();
    return data ? mapProductRow(data as Row) : null;
  }
  return demoProducts.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return null;
    const { data } = await supabase
      .from("products")
      .select(productSelect)
      .eq("id", id)
      .maybeSingle();
    return data ? mapProductRow(data as Row) : null;
  }
  return demoProducts.find((p) => p.id === id) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getAllProducts();
  const sameCategory = all.filter((p) => p.category_id === product.category_id && p.id !== product.id);
  const others = all.filter((p) => p.category_id !== product.category_id && p.id !== product.id);
  return [...sameCategory, ...others].slice(0, limit);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return sortProducts(all, "rating").slice(0, limit);
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  const best = all.filter((p) => p.is_best_seller);
  return (best.length ? best : all).slice(0, limit);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const all = await getAllProducts();
  const map = new Map(all.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
}

export async function getVariantForCheckout(variantId: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return null;
    const { data } = await supabase
      .from("product_variants")
      .select(`*, products(id, name, slug, category_id, is_active, product_images(url, sort_order))`)
      .eq("id", variantId)
      .maybeSingle();
    if (!data) return null;
    const row = data as Row;
    const product = (row.products ?? {}) as Row;
    if (!product.is_active || row.is_active === false) return null;
    const images = ((product.product_images ?? []) as Row[])
      .slice()
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((img) => String(img.url));
    return {
      variantId: row.id as string,
      productId: product.id as string,
      name: product.name as string,
      slug: product.slug as string,
      categoryId: product.category_id as string,
      sku: row.sku as string,
      size: row.size as string,
      potType: row.pot_type as string,
      price: Number(row.price),
      compareAt: row.compare_at_price === null ? null : Number(row.compare_at_price),
      stock: Number(row.stock),
      image: images[0] ?? "/images/plant-placeholder.svg",
    };
  }
  for (const product of demoProducts) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      if (!product.is_active || !variant.is_active) return null;
      return {
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        categoryId: product.category_id,
        sku: variant.sku,
        size: variant.size,
        potType: variant.pot_type,
        price: variant.price,
        compareAt: variant.compare_at_price,
        stock: variant.stock,
        image: product.images[0] ?? "/images/plant-placeholder.svg",
      };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Banners, reviews, settings, coupons, zones                                 */
/* -------------------------------------------------------------------------- */

export async function getBanners(placement?: BannerPlacement): Promise<Banner[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    let query = supabase.from("banners").select("*").eq("is_active", true).order("sort_order");
    if (placement) query = query.eq("placement", placement);
    const { data } = await query;
    const now = new Date();
    return ((data ?? []) as Row[])
      .filter((b) => {
        if (b.starts_at && new Date(b.starts_at) > now) return false;
        if (b.ends_at && new Date(b.ends_at) < now) return false;
        return true;
      })
      .map((b) => ({
        id: String(b.id),
        placement: b.placement,
        title: String(b.title),
        subtitle: (b.subtitle as string | null) ?? null,
        eyebrow: (b.eyebrow as string | null) ?? null,
        image_url: (b.image_url as string | null) ?? null,
        cta_label: (b.cta_label as string | null) ?? null,
        cta_url: (b.cta_url as string | null) ?? null,
        is_active: b.is_active !== false,
        sort_order: Number(b.sort_order ?? 0),
        starts_at: (b.starts_at as string | null) ?? null,
        ends_at: (b.ends_at as string | null) ?? null,
      }));
  }
  const now = new Date();
  return demoBanners
    .filter(
      (b) =>
        b.is_active &&
        (!placement || b.placement === placement) &&
        (!b.starts_at || new Date(b.starts_at) <= now) &&
        (!b.ends_at || new Date(b.ends_at) >= now),
    )
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      product_id: String(row.product_id),
      user_id: String(row.user_id),
      customer_name: String(row.customer_name ?? "Verified buyer"),
      order_id: (row.order_id as string | null) ?? null,
      rating: Number(row.rating),
      comment: String(row.comment),
      is_approved: true,
      created_at: String(row.created_at),
    }));
  }
  return demoReviews
    .filter((r) => r.product_id === productId && r.is_approved)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return demoSettings;
    const { data } = await supabase.from("site_settings").select("key, value");
    const settings = { ...demoSettings };
    for (const row of (data ?? []) as Row[]) {
      const key = String(row.key) as keyof SiteSettings;
      if (key in settings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings as any)[key] = row.value;
      }
    }
    settings.loyalty_enabled = settings.loyalty_earn_rate > 0 && settings.loyalty_redeem_rate > 0;
    return settings;
  }
  return {
    ...demoSettings,
    loyalty_enabled: demoSettings.loyalty_earn_rate > 0 && demoSettings.loyalty_redeem_rate > 0,
  };
}

/**
 * Every valid delivery pincode is serviceable. Rows in `delivery_zones` only
 * tune the delivery charge and ETA for pincodes we have specific rates for.
 */
export async function getDeliveryZone(pincode: string): Promise<DeliveryZone> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (supabase) {
      const { data } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("pincode", pincode)
        .maybeSingle();
      if (data) {
        return {
          pincode: String(data.pincode),
          is_serviceable: true,
          charge: Number(data.charge ?? 0),
          estimated_days: Number(data.estimated_days ?? 3),
        };
      }
    }
    const settings = await getSettings();
    return {
      pincode,
      is_serviceable: true,
      charge: settings.delivery_charge,
      estimated_days: 4,
    };
  }
  const zone = demoZones.find((z) => z.pincode === pincode);
  if (zone) return { ...zone, is_serviceable: true };
  return { pincode, is_serviceable: true, charge: demoSettings.delivery_charge, estimated_days: 4 };
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return null;
    const { data } = await supabase
      .from("coupons")
      .select("*, categories(name)")
      .eq("code", normalized)
      .maybeSingle();
    if (!data) return null;
    const row = data as Row;
    return {
      id: String(row.id),
      code: String(row.code),
      description: (row.description as string | null) ?? null,
      type: row.type,
      value: Number(row.value),
      min_order: Number(row.min_order ?? 0),
      max_discount: row.max_discount === null ? null : Number(row.max_discount),
      applies_to: row.applies_to ?? "all",
      category_id: (row.category_id as string | null) ?? null,
      category_name: (row.categories as Row | null)?.name ?? null,
      first_order_only: Boolean(row.first_order_only),
      starts_at: (row.starts_at as string | null) ?? null,
      ends_at: (row.ends_at as string | null) ?? null,
      usage_limit: row.usage_limit === null ? null : Number(row.usage_limit),
      used_count: Number(row.used_count ?? 0),
      is_active: row.is_active !== false,
    };
  }
  return demoCoupons.find((c) => c.code === normalized) ?? null;
}

export async function getCustomerOrderCount(userId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return 0;
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  }
  return getDb().orders.filter((o) => o.user_id === userId).length;
}

/* -------------------------------------------------------------------------- */
/*  Customer reads                                                             */
/* -------------------------------------------------------------------------- */

export async function getAddresses(userId: string): Promise<Address[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      name: String(row.name),
      phone: String(row.phone),
      line1: String(row.line1),
      line2: (row.line2 as string | null) ?? null,
      city: String(row.city),
      state: String(row.state),
      pincode: String(row.pincode),
      is_default: Boolean(row.is_default),
    }));
  }
  return getDb()
    .addresses.filter((a) => a.user_id === userId)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const ids = ((data ?? []) as Row[]).map((row) => String(row.product_id));
    return getProductsByIds(ids);
  }
  const ids = getDb().wishlists[userId] ?? [];
  return getProductsByIds(ids);
}

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return false;
    const { data } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();
    return Boolean(data);
  }
  return (getDb().wishlists[userId] ?? []).includes(productId);
}

export async function getRecentlyViewed(userId: string, limit = 10): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("recently_viewed")
      .select("product_id, viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit);
    const ids = ((data ?? []) as Row[]).map((row) => String(row.product_id));
    return getProductsByIds(ids);
  }
  const rows = (getDb().recentlyViewed[userId] ?? []).slice(0, limit);
  return getProductsByIds(rows.map((r) => r.productId));
}

/**
 * Whether the customer already shared website feedback for this order
 * (shown after checkout so we never prompt twice).
 */
export async function getSiteFeedbackForOrder(
  userId: string,
  orderId: string,
): Promise<{ rating: number; improvements: string | null } | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("site_feedback")
      .select("rating, improvements")
      .eq("user_id", userId)
      .eq("order_id", orderId)
      .limit(1)
      .maybeSingle();
    if (error) {
      // Table missing (migration pending) or transient failure — treat as "not submitted".
      if (!error.message.includes("Could not find")) {
        console.error("[catalog] site feedback lookup failed", error.message);
      }
      return null;
    }
    return data ? (data as { rating: number; improvements: string | null }) : null;
  }
  return (
    getDb().siteFeedback.find((feedback) => feedback.user_id === userId && feedback.order_id === orderId) ?? null
  );
}

/**
 * Server-side notifications for the admin command center beell. Order
 * notifications are enriched with the order id so items can deep-link to
 * /admin/orders/{id}. Reads the admin's own notifications (RLS-safe).
 */
export interface AdminNotificationItem extends Notification {
  orderId: string | null;
}

export async function getAdminNotifications(
  adminUserId: string,
  limit = 15,
): Promise<{ notifications: AdminNotificationItem[]; unread: number }> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return { notifications: [], unread: 0 };
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, body, is_read, created_at")
      .eq("user_id", adminUserId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[catalog] admin notifications failed", error.message);
      return { notifications: [], unread: 0 };
    }
    const rows = (data ?? []) as Row[];
    const items: AdminNotificationItem[] = rows.map((row) => ({
      id: String(row.id),
      user_id: adminUserId,
      type: String(row.type),
      title: String(row.title),
      body: String(row.body),
      is_read: Boolean(row.is_read),
      created_at: String(row.created_at),
      orderId: null,
    }));

    // Resolve order ids for order notifications so they can deep-link.
    const numbers = [...new Set(items.map((item) => item.title.match(/ORD-[0-9-]+/)?.[0]).filter(Boolean))] as string[];
    if (numbers.length) {
      const admin = createAdminSupabase();
      const { data: orderRows } = await admin
        .from("orders")
        .select("id, order_number")
        .in("order_number", numbers);
      for (const item of items) {
        const matched = (orderRows ?? []).find((row) => String(row.order_number) === item.title.match(/ORD-[0-9-]+/)?.[0]);
        if (matched) item.orderId = String(matched.id);
      }
    }

    return { notifications: items, unread: items.filter((item) => !item.is_read).length };
  }

  const db = getDb();
  const dbOrders = [...db.orders]; // copy — we only read
  const items = db.notifications
    .filter((n) => n.user_id === adminUserId)
    .slice(0, limit)
    .map((notification) => {
      const number = notification.title.match(/ORD-[0-9-]+/)?.[0];
      const order = number ? dbOrders.find((o) => o.order_number === number) : undefined;
      return { ...notification, orderId: order?.id ?? null };
    });
  return { notifications: items, unread: items.filter((item) => !item.is_read).length };
}

export async function getOrderForUser(identifier: string, userId?: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return null;
    const column = identifier.startsWith("ORD-") || identifier.startsWith("LP") ? "order_number" : "id";
    let query = supabase.from("orders").select(orderSelect).eq(column, identifier);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query.maybeSingle();
    if (error) console.error("[catalog] getOrderForUser failed", error.message);
    return data ? mapOrderRow(data as Row) : null;
  }
  const db = getDb();
  const order =
    db.orders.find(
      (o) => (o.id === identifier || o.order_number === identifier) && (!userId || o.user_id === userId),
    ) ?? null;
  return order ? structuredClone(order) : null;
}

/**
 * Service-role order lookup for server-side flows that have no customer
 * session (payment webhooks and post-payment order creation).
 */
export async function getOrderForUserAdmin(identifier: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    const db = getDb();
    const order = db.orders.find((o) => o.id === identifier || o.order_number === identifier) ?? null;
    return order ? structuredClone(order) : null;
  }
  const admin = createAdminSupabase();
  const column = identifier.startsWith("ORD-") || identifier.startsWith("LP") ? "order_number" : "id";
  const { data, error } = await admin.from("orders").select(orderSelect).eq(column, identifier).maybeSingle();
  if (error) {
    console.error("[catalog] getOrderForUserAdmin failed", error.message);
    return null;
  }
  return data ? mapOrderRow(data as Row) : null;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("orders")
      .select(orderSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map(mapOrderRow);
  }
  return getDb()
    .orders.filter((o) => o.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((o) => structuredClone(o));
}

export async function getCustomerNotifications(userId: string): Promise<Notification[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      // Checkout intents are stored in this table to avoid a schema migration;
      // they are internal and must never surface in the customer's inbox.
      .not("type", "like", "checkout_intent%")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []) as Notification[];
  }
  return getDb()
    .notifications.filter((n) => n.user_id === userId && !n.type.startsWith("checkout_intent"))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getUnreadNotificationCount(userId: string) {
  const notifications = await getCustomerNotifications(userId);
  return notifications.filter((n) => !n.is_read).length;
}

/* -------------------------------------------------------------------------- */
/*  Admin reads                                                                */
/* -------------------------------------------------------------------------- */

export async function getAdminProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("products")
      .select(productSelect)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map(mapProductRow);
  }
  return structuredClone(getDb().products);
}

export async function getAllOrders(): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("orders")
      .select(orderSelect)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map(mapOrderRow);
  }
  return structuredClone(
    getDb()
      .orders.slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  );
}

export async function getAdminStats(): Promise<ReturnType<typeof buildDemoStats>> {
  const orders = await getAllOrders();
  const products = await getAdminProducts();
  const settings = await getSettings();
  return buildDemoStats(orders, products, settings.low_stock_threshold);
}

export async function getAdminCustomers(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      email: String(row.email ?? ""),
      full_name: String(row.full_name ?? ""),
      phone: (row.phone as string | null) ?? null,
      role: row.role === "admin" ? "admin" : "customer",
      is_blocked: Boolean(row.is_blocked),
      loyalty_points: Number(row.loyalty_points ?? 0),
      created_at: String(row.created_at ?? ""),
    }));
  }
  return structuredClone(getDb().users);
}

export async function getAdminReviews(): Promise<Review[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("reviews")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      product_id: String(row.product_id),
      product_name: String((row.products as Row | null)?.name ?? "—"),
      user_id: String(row.user_id),
      customer_name: String(row.customer_name ?? "Customer"),
      order_id: (row.order_id as string | null) ?? null,
      rating: Number(row.rating),
      comment: String(row.comment),
      is_approved: Boolean(row.is_approved),
      created_at: String(row.created_at),
    }));
  }
  return structuredClone(getDb().reviews);
}

export async function getAdminReturns(): Promise<import("@/lib/types").ReturnRequest[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("return_requests")
      .select("*, orders(order_number), order_items(name), profiles(full_name)");
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      order_id: String(row.order_id),
      order_number: String((row.orders as Row | null)?.order_number ?? ""),
      order_item_id: String(row.order_item_id),
      product_name: String((row.order_items as Row | null)?.name ?? "—"),
      customer_name: String((row.profiles as Row | null)?.full_name ?? "Customer"),
      reason: String(row.reason),
      photo_urls: (row.photo_urls as string[]) ?? [],
      status: row.status,
      admin_note: (row.admin_note as string | null) ?? null,
      created_at: String(row.created_at),
    }));
  }
  return structuredClone(getDb().returns);
}

export async function getCoupons(): Promise<Coupon[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("coupons")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      code: String(row.code),
      description: (row.description as string | null) ?? null,
      type: row.type,
      value: Number(row.value),
      min_order: Number(row.min_order ?? 0),
      max_discount: row.max_discount === null ? null : Number(row.max_discount),
      applies_to: row.applies_to ?? "all",
      category_id: (row.category_id as string | null) ?? null,
      category_name: (row.categories as Row | null)?.name ?? null,
      first_order_only: Boolean(row.first_order_only),
      starts_at: (row.starts_at as string | null) ?? null,
      ends_at: (row.ends_at as string | null) ?? null,
      usage_limit: row.usage_limit === null ? null : Number(row.usage_limit),
      used_count: Number(row.used_count ?? 0),
      is_active: row.is_active !== false,
    }));
  }
  return structuredClone(getDb().coupons);
}

export async function getAllBanners(): Promise<Banner[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("placement")
      .order("sort_order");
    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      placement: row.placement,
      title: String(row.title),
      subtitle: (row.subtitle as string | null) ?? null,
      eyebrow: (row.eyebrow as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      cta_label: (row.cta_label as string | null) ?? null,
      cta_url: (row.cta_url as string | null) ?? null,
      is_active: row.is_active !== false,
      sort_order: Number(row.sort_order ?? 0),
      starts_at: (row.starts_at as string | null) ?? null,
      ends_at: (row.ends_at as string | null) ?? null,
    }));
  }
  return structuredClone(getDb().banners);
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase.from("delivery_zones").select("*").order("pincode");
    return ((data ?? []) as Row[]).map((row) => ({
      pincode: String(row.pincode),
      is_serviceable: Boolean(row.is_serviceable),
      charge: Number(row.charge ?? 0),
      estimated_days: Number(row.estimated_days ?? 3),
    }));
  }
  return structuredClone(demoZones);
}

export async function getAllCustomersForAdmin() {
  return getAdminCustomers();
}

export async function getCustomerLoyalty(userId: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseReadOnly();
    if (!supabase) return [];
    const { data } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }
  return getDb().loyalty.filter((t) => t.user_id === userId);
}

export async function getOrderStatusCounts() {
  const orders = await getAllOrders();
  return orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});
}

export const demoProductFallback = demoProducts;
