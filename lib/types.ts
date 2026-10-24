export type Role = "customer" | "admin";

export type OrderStatus =
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod = "online" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cod_pending";
export type ReturnStatus = "requested" | "approved" | "rejected" | "replaced" | "refunded";
export type CouponType = "percent" | "flat";
export type BannerPlacement = "hero" | "offer" | "special_offer" | "dashboard_promo";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_blocked: boolean;
  loyalty_points: number;
  created_at?: string;
  avatar_url?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  pot_type: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
  badge: "Popular" | "Best Seller" | "New" | null;
  is_active: boolean;
  is_best_seller: boolean;
  light: "Low" | "Medium" | "Bright" | "Full Sun";
  water: "Low" | "Medium" | "High";
  difficulty: "Easy" | "Moderate" | "Expert";
  pet_friendly: boolean;
  air_purifying: boolean;
  care_guide: string | null;
  rating: number;
  review_count: number;
  images: string[];
  variants: ProductVariant[];
  created_at: string;
}

export interface Banner {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtitle: string | null;
  eyebrow?: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface AddressSnapshot {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  image: string;
  size: string;
  potType: string;
  price: number;
  compareAtPrice: number | null;
  qty: number;
  stock: number;
  categoryId: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  image: string;
  size: string;
  pot_type: string;
  price: number;
  qty: number;
}

export interface StatusHistoryEntry {
  id: string;
  status: OrderStatus | string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  loyalty_discount?: number;
  delivery_charge: number;
  gst: number;
  total: number;
  loyalty_points_earned: number;
  loyalty_points_used: number;
  address: AddressSnapshot;
  coupon_code: string | null;
  tracking_number: string | null;
  courier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history: StatusHistoryEntry[];
  invoice_number?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  min_order: number;
  max_discount: number | null;
  applies_to: "all" | "category";
  category_id: string | null;
  category_name?: string | null;
  first_order_only: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  product_name?: string;
  user_id: string;
  customer_name: string;
  order_id: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_number?: string;
  order_item_id: string;
  product_name: string;
  customer_name: string;
  reason: string;
  photo_urls: string[];
  status: ReturnStatus;
  admin_note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/** Website-level feedback collected right after an order is completed. */
export interface SiteFeedback {
  id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  improvements: string | null;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  points: number;
  type: "earned" | "redeemed" | "adjusted" | "expired";
  note: string | null;
  created_at: string;
}

export interface DeliveryZone {
  pincode: string;
  is_serviceable: boolean;
  charge: number;
  estimated_days: number;
}

export interface SiteSettings {
  store_name: string;
  store_tagline: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  gst_number: string;
  free_shipping_threshold: number;
  delivery_charge: number;
  gst_percent: number;
  return_window_days: number;
  claim_window_hours: number;
  loyalty_earn_rate: number;
  loyalty_redeem_rate: number;
  loyalty_enabled: boolean;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  low_stock_threshold: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  loyaltyDiscount: number;
  deliveryCharge: number;
  gst: number;
  total: number;
  freeShippingRemaining: number;
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  couponApplied: Coupon | null;
  couponError: string | null;
}

export interface AdminStats {
  revenueToday: number;
  ordersToday: number;
  pendingDispatch: number;
  lowStock: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
}

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  light?: string;
  water?: string;
  petFriendly?: boolean;
  size?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  bestSeller?: boolean;
}

export interface PagedProducts {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
