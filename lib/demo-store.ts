import {
  demoAddresses,
  demoBanners,
  demoCategories,
  demoCoupons,
  demoLoyalty,
  demoNotifications,
  demoOrders,
  demoProducts,
  demoReturns,
  demoReviews,
  demoSettings,
  demoUsers,
  demoZones,
} from "@/lib/demo-data";
import type {
  Address,
  Banner,
  Category,
  Coupon,
  DeliveryZone,
  LoyaltyTransaction,
  Notification,
  Order,
  Product,
  ReturnRequest,
  Review,
  SiteFeedback,
  SiteSettings,
  User,
} from "@/lib/types";

export interface DemoDb {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
  users: User[];
  addresses: Address[];
  orders: Order[];
  reviews: Review[];
  returns: ReturnRequest[];
  notifications: Notification[];
  siteFeedback: SiteFeedback[];
  loyalty: LoyaltyTransaction[];
  wishlists: Record<string, string[]>;
  recentlyViewed: Record<string, { productId: string; viewedAt: string }[]>;
  settings: SiteSettings;
  zones: DeliveryZone[];
  orderSeq: number;
  passwords: Record<string, string>;
  preferences: Record<string, { email: boolean; whatsapp: boolean; sms: boolean }>;
}

function createDb(): DemoDb {
  return structuredClone({
    products: demoProducts,
    categories: demoCategories,
    banners: demoBanners,
    coupons: demoCoupons,
    users: demoUsers,
    addresses: demoAddresses,
    orders: demoOrders,
    reviews: demoReviews,
    returns: demoReturns,
    notifications: demoNotifications,
    siteFeedback: [],
    loyalty: demoLoyalty,
    wishlists: {},
    recentlyViewed: {},
    settings: demoSettings,
    zones: demoZones,
    orderSeq: 1000,
    passwords: {
      "admin@leafandpot.in": "demo1234",
    },
    preferences: {},
  } satisfies DemoDb);
}

declare global {
  // eslint-disable-next-line no-var
  var __leafAndPotDb: DemoDb | undefined;
}

export function getDb(): DemoDb {
  if (!globalThis.__leafAndPotDb || globalThis.__leafAndPotDb.orders.some((o) => o.id === "o1")) {
    globalThis.__leafAndPotDb = createDb();
  }
  return globalThis.__leafAndPotDb;
}

export function resetDb() {
  globalThis.__leafAndPotDb = createDb();
}

export function nextOrderNumber(): string {
  const db = getDb();
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const prefix = `ORD-${date}-`;
  const next =
    db.orders.reduce((max, order) => {
      if (!order.order_number.startsWith(prefix)) return max;
      const serial = Number.parseInt(order.order_number.slice(prefix.length), 10);
      return Number.isFinite(serial) && serial > max ? serial : max;
    }, 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function demoCategoryWithCount(category: Category): Category {
  if (category.slug === "best-sellers") {
    return {
      ...category,
      product_count: getDb().products.filter((p) => p.is_active && p.is_best_seller).length,
    };
  }
  return {
    ...category,
    product_count: getDb().products.filter(
      (p) => p.is_active && p.category_id === category.id,
    ).length,
  };
}
