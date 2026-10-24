import type {
  Address,
  AdminStats,
  Banner,
  Category,
  Coupon,
  DeliveryZone,
  LoyaltyTransaction,
  Notification,
  Order,
  Product,
  ProductVariant,
  ReturnRequest,
  Review,
  SiteSettings,
  User,
} from "@/lib/types";

export const DEMO_IMAGES = {
  hero: "/images/landing.png",
  heroAlt: "/images/chinese evergreen.png",
  offer: "/images/red calathea.jpg",
  special: "/images/lucky bamboo.jpg",
  peaceLily: "/images/paathi pull.jpg",
  chineseEvergreen: "/images/chinese evergreen.png",
  aloeVera: "/images/aloevera plant.png",
  luckyBamboo: "/images/lucky bamboo.jpg",
  calatheaLutea: "/images/calathea plant.jpg",
  fanPalm: "/images/palm.jpg",
  redCalathea: "/images/red calathea.jpg",
};

const daysAgo = (days: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
};

export const demoCategories: Category[] = [
  {
    id: "c1",
    name: "Indoor Plants",
    slug: "indoor-plants",
    description: "Calm, air-purifying companions for your living room, bedroom and desk.",
    image_url: DEMO_IMAGES.chineseEvergreen,
    icon: "Leaf",
    parent_id: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "c2",
    name: "Succulents & Herbs",
    slug: "succulents",
    description: "Hardy healing plants and soothing succulents that love sunlight.",
    image_url: DEMO_IMAGES.aloeVera,
    icon: "Sprout",
    parent_id: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "c3",
    name: "Air Purifiers",
    slug: "air-purifiers",
    description: "NASA-backed natural filters that purify indoor toxic air.",
    image_url: DEMO_IMAGES.peaceLily,
    icon: "Wind",
    parent_id: null,
    sort_order: 3,
    is_active: true,
  },
  {
    id: "c4",
    name: "Lucky & Festive",
    slug: "lucky-plants",
    description: "Auspicious greens bringing prosperity, positive Vastu, and harmony.",
    image_url: DEMO_IMAGES.luckyBamboo,
    icon: "Sparkles",
    parent_id: null,
    sort_order: 4,
    is_active: true,
  },
  {
    id: "c5",
    name: "Exotic Foliage",
    slug: "calathea-foliage",
    description: "Dramatic collector prayer plants with velvety textures and vivid tones.",
    image_url: DEMO_IMAGES.calatheaLutea,
    icon: "Heart",
    parent_id: null,
    sort_order: 5,
    is_active: true,
  },
  {
    id: "c6",
    name: "Palms & Outdoor",
    slug: "palms",
    description: "Grand structural statement fronds for sunny balconies and verandas.",
    image_url: DEMO_IMAGES.fanPalm,
    icon: "Sun",
    parent_id: null,
    sort_order: 6,
    is_active: true,
  },
  {
    id: "c7",
    name: "Best Sellers",
    slug: "best-sellers",
    description: "The highest rated live plants loved by thousands of plant parents.",
    image_url: DEMO_IMAGES.peaceLily,
    icon: "Award",
    parent_id: null,
    sort_order: 7,
    is_active: true,
  },
];

type VariantSeed = [size: string, pot: string, price: number, compare: number | null, stock: number];

interface ProductSeed {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compare?: number;
  badge?: Product["badge"];
  best?: boolean;
  light: Product["light"];
  water: Product["water"];
  difficulty: Product["difficulty"];
  pet: boolean;
  air?: boolean;
  rating: number;
  reviews: number;
  image: string;
  gallery?: string[];
  variants?: VariantSeed[];
  description: string;
  care: string;
}

const seeds: ProductSeed[] = [
  {
    id: "p1",
    name: "Peace Lily (Paathi Pull)",
    slug: "peace-lily",
    category: "c1", // Indoor Plants
    price: 299,
    compare: 399,
    badge: "Best Seller",
    best: true,
    light: "Medium",
    water: "Medium",
    difficulty: "Easy",
    pet: false,
    air: true,
    rating: 4.8,
    reviews: 142,
    image: DEMO_IMAGES.peaceLily,
    variants: [
      ["Pot", '6" Nursery Pot (100% Price)', 299, 399, 30],
      ["With Plastic Cover", "Nursery Grow Bag (80% Price)", 239, 319, 25],
      ["Without Pot", "Bare Root / Root Ball (75% Price)", 224, 299, 20],
      ["Cuttings", "Fresh Rooted Cutting (50% Price)", 149, 199, 35],
    ],
    description:
      "Renowned for its elegant white hooded blooms and lush, deep green leaves. The Peace Lily (locally called Paathi Pull) is a NASA-certified top air purifier that visibly tells you when it needs water and bounces right back.",
    care:
      "Keep soil lightly moist. Prefers medium to bright indirect light. Mist weekly and wipe leaves with a damp cloth. Keep away from pets.",
  },
  {
    id: "p2",
    name: "Chinese Evergreen (Aglaonema)",
    slug: "chinese-evergreen",
    category: "c1", // Indoor Plants
    price: 399,
    compare: 499,
    badge: "Popular",
    best: true,
    light: "Low",
    water: "Low",
    difficulty: "Easy",
    pet: false,
    air: true,
    rating: 4.9,
    reviews: 88,
    image: DEMO_IMAGES.chineseEvergreen,
    variants: [
      ["Pot", '6" Nursery Pot (100% Price)', 399, 499, 25],
      ["With Plastic Cover", "Nursery Grow Bag (80% Price)", 319, 399, 20],
      ["Without Pot", "Bare Root / Root Ball (75% Price)", 299, 374, 18],
      ["Cuttings", "Fresh Rooted Cutting (50% Price)", 199, 249, 30],
    ],
    description:
      "Striking variegated cream and green leaves with a lush, full habit. Exceptionally tolerant of low light, air-conditioning, and missed waterings, making it ideal for busy homes and offices.",
    care:
      "Water every 10–14 days when the top 2 inches of soil feel dry. Flourishes in low to bright indirect light.",
  },
  {
    id: "p3",
    name: "Aloe Vera Plant",
    slug: "aloe-vera",
    category: "c2", // Succulents & Herbs
    price: 199,
    compare: 249,
    badge: "Popular",
    best: true,
    light: "Bright",
    water: "Low",
    difficulty: "Easy",
    pet: false,
    air: true,
    rating: 4.7,
    reviews: 210,
    image: DEMO_IMAGES.aloeVera,
    variants: [
      ["Small", '4" Nursery Pot', 199, 249, 50],
      ["Medium", '6" Terracotta Planter', 349, 449, 22],
    ],
    description:
      "The essential medicinal houseplant. Thick, gel-filled spiky leaves that purify the air and provide natural soothing skin relief. Asks for bright sunlight and very little water.",
    care:
      "Place in direct or bright indirect sunlight. Water deeply only once every 2–3 weeks after soil dries completely.",
  },
  {
    id: "p4",
    name: "Lucky Bamboo (3-Tier)",
    slug: "lucky-bamboo",
    category: "c4", // Lucky & Festive
    price: 299,
    compare: 399,
    badge: "Best Seller",
    best: true,
    light: "Low",
    water: "Medium",
    difficulty: "Easy",
    pet: false,
    air: true,
    rating: 4.8,
    reviews: 175,
    image: DEMO_IMAGES.luckyBamboo,
    variants: [
      ["Pot", "Ceramic Planter Bowl (100% Price)", 299, 399, 30],
      ["With Plastic Cover", "Protective Sleeve Wrap (80% Price)", 239, 319, 25],
      ["Without Pot", "Bare Stalks Bundle (75% Price)", 224, 299, 20],
      ["Cuttings", "Individual Fresh Stalks (50% Price)", 149, 199, 35],
    ],
    description:
      "A revered symbol of good fortune, harmony, and prosperity in Vastu and Feng Shui. Vibrant green stalks ready to display on study desks, coffee tables, and countertops.",
    care:
      "Keep in bright or gentle indirect light. Change water every 7–10 days; avoid direct scorching afternoon sun.",
  },
  {
    id: "p5",
    name: "Calathea Lutea (Cigar Plant)",
    slug: "calathea-lutea",
    category: "c5", // Exotic Foliage
    price: 549,
    compare: 699,
    badge: "New",
    best: false,
    light: "Bright",
    water: "Medium",
    difficulty: "Moderate",
    pet: true,
    air: true,
    rating: 4.6,
    reviews: 62,
    image: DEMO_IMAGES.calatheaLutea,
    variants: [
      ["Pot", '6" Nursery Pot (100% Price)', 549, 699, 15],
      ["With Plastic Cover", "Nursery Grow Bag (80% Price)", 439, 559, 15],
      ["Without Pot", "Bare Root / Root Ball (75% Price)", 412, 524, 12],
      ["Cuttings", "Rooted Stem Cutting (50% Price)", 275, 349, 20],
    ],
    description:
      "Architectural, paddle-like upright leaves with silvery-white undersides that transform any room into a tropical oasis. Completely pet-safe and non-toxic.",
    care:
      "Thrives in bright indirect light and warm humidity. Water with filtered water when the top inch of soil dries. Mist foliage regularly.",
  },
  {
    id: "p6",
    name: "Ruffled Fan Palm (Licuala)",
    slug: "fan-palm",
    category: "c6", // Palms & Outdoor
    price: 599,
    compare: 749,
    badge: "New",
    best: false,
    light: "Bright",
    water: "Medium",
    difficulty: "Moderate",
    pet: true,
    air: true,
    rating: 4.9,
    reviews: 45,
    image: DEMO_IMAGES.fanPalm,
    variants: [
      ["Pot", '7" Nursery Pot (100% Price)', 599, 749, 12],
      ["With Plastic Cover", "Nursery Grow Bag (80% Price)", 479, 599, 14],
      ["Without Pot", "Bare Root / Root Ball (75% Price)", 449, 562, 10],
      ["Cuttings", "Rooted Frond Cutting (50% Price)", 299, 374, 15],
    ],
    description:
      "Circular pleated fronds that unfold like royal origami fans. One of the most spectacular palms in the botanical world — an instant statement for bright entryways, living rooms, and sheltered verandahs.",
    care:
      "Prefers generous bright filtered light without direct scorching sun. Water thoroughly when top inch is dry. Protect from chilly drafts.",
  },
  {
    id: "p7",
    name: "Red Calathea (Velvet Rufibarba)",
    slug: "red-calathea",
    category: "c5", // Exotic Foliage
    price: 449,
    compare: 549,
    badge: "New",
    best: false,
    light: "Medium",
    water: "Medium",
    difficulty: "Moderate",
    pet: true,
    air: true,
    rating: 4.7,
    reviews: 53,
    image: DEMO_IMAGES.redCalathea,
    variants: [
      ["Pot", '5" Nursery Pot (100% Price)', 449, 549, 18],
      ["With Plastic Cover", "Nursery Grow Bag (80% Price)", 359, 439, 16],
      ["Without Pot", "Bare Root / Root Ball (75% Price)", 337, 412, 14],
      ["Cuttings", "Fresh Rooted Cutting (50% Price)", 225, 275, 25],
    ],
    description:
      "Wavy, lance-shaped leaves with velvety olive green tops and breathtaking deep wine-red undersides. Naturally folds its leaves upward at night in true prayer plant fashion.",
    care:
      "Medium indirect light, away from drafts. Maintain moderate humidity and water when the top soil is dry. Use dechlorinated water.",
  },
];

function buildVariants(seed: ProductSeed): ProductVariant[] {
  const rows: VariantSeed[] =
    seed.variants ?? [["Standard", '6" Nursery Pot', seed.price, seed.compare ?? null, 20]];
  return rows.map(([size, pot, price, compare, stock], index) => ({
    id: `${seed.id}-v${index + 1}`,
    product_id: seed.id,
    sku: `LP-${seed.id.toUpperCase()}-${index + 1}`,
    size,
    pot_type: pot,
    price,
    compare_at_price: compare,
    stock,
    low_stock_threshold: 5,
    is_active: true,
  }));
}

export const demoProducts: Product[] = seeds.map((seed, index) => {
  const category = demoCategories.find((c) => c.id === seed.category);
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    short_description: seed.description.slice(0, 118),
    category_id: seed.category,
    category_name: category?.name ?? "Plants",
    category_slug: category?.slug ?? "plants",
    badge: seed.badge ?? null,
    is_active: true,
    is_best_seller: Boolean(seed.best),
    light: seed.light,
    water: seed.water,
    difficulty: seed.difficulty,
    pet_friendly: seed.pet,
    air_purifying: seed.air ?? false,
    care_guide: seed.care,
    rating: seed.rating,
    review_count: seed.reviews,
    images: seed.gallery?.length ? [seed.image, ...seed.gallery] : [seed.image],
    variants: buildVariants(seed),
    created_at: daysAgo(60 - index),
  };
});

export const demoBanners: Banner[] = [
  {
    id: "b1",
    placement: "hero",
    title: "Healthy Plants for a Happier You",
    subtitle:
      "Discover our handpicked indoor plants, balcony palms, hardy succulents and elegant pots. Fresh. Green. Delivered to your door.",
    eyebrow: "Bring Nature Home",
    image_url: DEMO_IMAGES.hero,
    cta_label: "Shop Now",
    cta_url: "/shop",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "b2",
    placement: "hero",
    title: "Fresh Greenery for Every Room",
    subtitle: "From low-light desk corners to sunny garden balconies — find the one that fits your space.",
    eyebrow: "New Season",
    image_url: DEMO_IMAGES.heroAlt,
    cta_label: "Explore Indoor Plants",
    cta_url: "/category/indoor-plants",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "b3",
    placement: "hero",
    title: "Healing Aloe & Succulents",
    subtitle: "Hardy, air-purifying succulents that thrive on bright windowsills with minimal care.",
    eyebrow: "Easy Care",
    image_url: DEMO_IMAGES.aloeVera,
    cta_label: "Shop Succulents",
    cta_url: "/category/succulents",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "b4",
    placement: "offer",
    title: "Get 20% Off on your first order",
    subtitle: "Use code WELCOME20. Because every home deserves its first plant.",
    eyebrow: "New here?",
    image_url: DEMO_IMAGES.offer,
    cta_label: "Shop Now",
    cta_url: "/shop",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "b5",
    placement: "special_offer",
    title: "Get 15% Off on Indoor Plants",
    subtitle: "Use code INDOOR15 on your next leafy addition.",
    eyebrow: "This week only",
    image_url: DEMO_IMAGES.special,
    cta_label: "Shop the offer",
    cta_url: "/category/indoor-plants",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "b6",
    placement: "dashboard_promo",
    title: "Love Your Plants",
    subtitle: "Care guides, repotting reminders and a plant doctor — all in one place.",
    eyebrow: "Leaf & Pot care",
    image_url: DEMO_IMAGES.special,
    cta_label: "Learn More",
    cta_url: "/about#care",
    is_active: true,
    sort_order: 1,
  },
];

export const demoCoupons: Coupon[] = [
  {
    id: "cp1",
    code: "WELCOME20",
    description: "20% off your first order, up to ₹300.",
    type: "percent",
    value: 20,
    min_order: 499,
    max_discount: 300,
    applies_to: "all",
    category_id: null,
    first_order_only: true,
    usage_limit: null,
    used_count: 48,
    is_active: true,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "cp2",
    code: "INDOOR15",
    description: "15% off indoor plants, up to ₹250.",
    type: "percent",
    value: 15,
    min_order: 699,
    max_discount: 250,
    applies_to: "category",
    category_id: "c1",
    first_order_only: false,
    usage_limit: 200,
    used_count: 73,
    is_active: true,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "cp3",
    code: "GREEN100",
    description: "Flat ₹100 off orders above ₹999.",
    type: "flat",
    value: 100,
    min_order: 999,
    max_discount: null,
    applies_to: "all",
    category_id: null,
    first_order_only: false,
    usage_limit: 500,
    used_count: 142,
    is_active: true,
    starts_at: null,
    ends_at: null,
  },
];

export const demoZones: DeliveryZone[] = [
  { pincode: "560001", is_serviceable: true, charge: 49, estimated_days: 2 },
  { pincode: "560038", is_serviceable: true, charge: 0, estimated_days: 1 },
  { pincode: "560035", is_serviceable: true, charge: 49, estimated_days: 2 },
  { pincode: "110001", is_serviceable: true, charge: 79, estimated_days: 4 },
  { pincode: "400001", is_serviceable: true, charge: 69, estimated_days: 3 },
  { pincode: "600001", is_serviceable: true, charge: 79, estimated_days: 4 },
  { pincode: "700001", is_serviceable: true, charge: 89, estimated_days: 5 },
];

export const demoSettings: SiteSettings = {
  store_name: "Leaf & Pot",
  store_tagline: "Green Home. Happy You.",
  store_email: "hello@leafandpot.in",
  store_phone: "+91 80 4718 2200",
  store_address: "42, Green Avenue, Indiranagar, Bengaluru 560038",
  gst_number: "29ABCDE1234F1Z5",
  free_shipping_threshold: 999,
  delivery_charge: 49,
  gst_percent: 5,
  return_window_days: 7,
  claim_window_hours: 48,
  loyalty_earn_rate: 0,
  loyalty_redeem_rate: 0,
  loyalty_enabled: false,
  cod_enabled: true,
  online_payment_enabled: true,
  low_stock_threshold: 5,
};

export const demoUsers: User[] = [
  {
    id: "admin-1",
    email: "admin@leafandpot.in",
    role: "admin",
    full_name: "Store Admin",
    phone: "9876500000",
    avatar_url: null,
    is_blocked: false,
    loyalty_points: 0,
    created_at: new Date().toISOString(),
  },
];

export const demoAddresses: Address[] = [];

export const demoOrders: Order[] = [];

export const demoReviews: Review[] = [];

export const demoReturns: ReturnRequest[] = [];

export const demoNotifications: Notification[] = [];

export const demoLoyalty: LoyaltyTransaction[] = [];

export function buildDemoStats(
  orders: Order[],
  products: Product[],
  lowStockThreshold = 5,
): AdminStats {
  const today = new Date().toDateString();
  const revenueToday = orders
    .filter((o) => new Date(o.created_at).toDateString() === today && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const ordersToday = orders.filter(
    (o) => new Date(o.created_at).toDateString() === today && o.status !== "cancelled",
  ).length;
  const pendingDispatch = orders.filter((o) => ["processing", "packed"].includes(o.status)).length;
  const lowStock = products.reduce(
    (count, p) =>
      count +
      p.variants.filter((v) => v.is_active && v.stock > 0 && v.stock <= lowStockThreshold).length,
    0,
  );

  const revenueByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const dayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === key && o.status !== "cancelled",
    );
    return {
      date: date.toISOString(),
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length,
    };
  });

  const statuses = ["processing", "packed", "shipped", "delivered", "cancelled", "returned"];
  const ordersByStatus = statuses.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  const productTotals = new Map<string, { units: number; revenue: number }>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const current = productTotals.get(item.name) ?? { units: 0, revenue: 0 };
      current.units += item.qty;
      current.revenue += item.price * item.qty;
      productTotals.set(item.name, current);
    }
  }
  const topProducts = [...productTotals.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return { revenueToday, ordersToday, pendingDispatch, lowStock, revenueByDay, ordersByStatus, topProducts };
}

export const demoCustomers = demoUsers.filter((u) => u.role === "customer");
