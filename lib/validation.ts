import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number.");
export const pincodeSchema = z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters."),
  next: z.string().optional(),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
  line1: z.string().trim().max(160).optional().or(z.literal("")),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  pincode: z.string().trim().optional().or(z.literal("")),
  next: z.string().optional(),
  terms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms to continue." }) }),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter the recipient's name.").max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(5, "Enter the street address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter city.").max(60),
  state: z.string().trim().min(2, "Enter state.").max(60),
  pincode: pincodeSchema,
  is_default: z.boolean().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: phoneSchema.or(z.literal("")),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Your cart is empty."),
  address_id: z.string().optional(),
  address: addressSchema.omit({ id: true, is_default: true }).optional(),
  coupon_code: z.string().trim().max(32).optional(),
  payment_method: z.enum(["online", "cod"]),
  pincode: pincodeSchema.optional(),
  notes: z.string().trim().max(500).optional(),
  use_loyalty: z.boolean().optional(),
  save_address: z.boolean().optional(),
});

export const reviewSchema = z.object({
  product_id: z.string().min(1),
  order_id: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(1200),
});

export const feedbackSchema = z.object({
  order_id: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1, "Choose a star rating.").max(5),
  improvements: z.string().trim().max(2000).optional(),
});

export const returnSchema = z.object({
  order_id: z.string().min(1),
  order_item_id: z.string().min(1),
  reason: z.string().trim().min(10, "Please describe the issue (at least 10 characters).").max(1000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  topic: z.enum(["Order help", "Plant care", "Returns", "Wholesale", "Something else"]),
  message: z.string().trim().min(10).max(2000),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(2).max(32),
  items: z.array(z.object({ variantId: z.string().min(1), qty: z.number().int().min(1).max(20) })).min(1),
});

export const searchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(100).optional(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required.").max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
  description: z.string().trim().min(10).max(4000),
  category_id: z.string().min(1, "Choose a category."),
  badge: z.enum(["", "Popular", "Best Seller", "New"]).optional(),
  light: z.enum(["Low", "Medium", "Bright", "Full Sun"]),
  water: z.enum(["Low", "Medium", "High"]),
  difficulty: z.enum(["Easy", "Moderate", "Expert"]),
  pet_friendly: z.boolean().optional(),
  air_purifying: z.boolean().optional(),
  is_best_seller: z.boolean().optional(),
  is_active: z.boolean().optional(),
  care_guide: z.string().trim().max(2000).optional(),
  images: z.string().trim().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        sku: z.string().trim().min(2).max(48),
        size: z.string().trim().min(1).max(40),
        pot_type: z.string().trim().min(1).max(60),
        price: z.coerce.number().min(1).max(500000),
        compare_at_price: z.coerce.number().min(0).max(500000).optional(),
        stock: z.coerce.number().int().min(0).max(100000),
        low_stock_threshold: z.coerce.number().int().min(0).max(1000).optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .min(1, "Add at least one variant."),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  icon: z.string().trim().max(40).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
});

export const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(3).max(32).transform((v) => v.toUpperCase()),
  description: z.string().trim().max(300).optional(),
  type: z.enum(["percent", "flat"]),
  value: z.coerce.number().min(1),
  min_order: z.coerce.number().min(0).default(0),
  max_discount: z.coerce.number().min(0).optional(),
  applies_to: z.enum(["all", "category"]).default("all"),
  category_id: z.string().optional(),
  first_order_only: z.boolean().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  usage_limit: z.coerce.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const bannerSchema = z.object({
  id: z.string().optional(),
  placement: z.enum(["hero", "offer", "special_offer", "dashboard_promo"]),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(300).optional(),
  eyebrow: z.string().trim().max(60).optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  cta_label: z.string().trim().max(40).optional(),
  cta_url: z.string().trim().max(300).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(99).optional(),
});

export const settingsSchema = z.object({
  store_name: z.string().trim().min(2).max(80),
  store_email: emailSchema,
  store_phone: z.string().trim().min(6).max(24),
  store_address: z.string().trim().max(240),
  gst_number: z.string().trim().max(20),
  free_shipping_threshold: z.coerce.number().min(0).max(100000),
  delivery_charge: z.coerce.number().min(0).max(5000),
  gst_percent: z.coerce.number().min(0).max(28),
  return_window_days: z.coerce.number().int().min(0).max(90),
  claim_window_hours: z.coerce.number().int().min(0).max(720),
  loyalty_earn_rate: z.coerce.number().min(0).max(100),
  loyalty_redeem_rate: z.coerce.number().min(0).max(100),
  loyalty_enabled: z.boolean().optional(),
  cod_enabled: z.boolean().optional(),
  online_payment_enabled: z.boolean().optional(),
  low_stock_threshold: z.coerce.number().int().min(0).max(1000),
});

export const zoneSchema = z.object({
  pincode: pincodeSchema,
  is_serviceable: z.boolean().optional(),
  charge: z.coerce.number().min(0).max(5000),
  estimated_days: z.coerce.number().int().min(0).max(30),
});

export const orderStatusSchema = z.object({
  order_id: z.string().min(1),
  status: z.enum(["processing", "packed", "shipped", "delivered", "cancelled"]),
  note: z.string().trim().max(300).optional(),
  tracking_number: z.string().trim().max(80).optional(),
  courier: z.string().trim().max(80).optional(),
});

export const returnStatusSchema = z.object({
  return_id: z.string().min(1),
  status: z.enum(["approved", "rejected", "replaced", "refunded"]),
  admin_note: z.string().trim().max(500).optional(),
});

export const loyaltyAdjustSchema = z.object({
  user_id: z.string().min(1),
  points: z.coerce.number().int().min(-100000).max(100000),
  note: z.string().trim().min(3).max(200),
});

export const cmsNotificationSchema = z.object({
  key: z.string().trim().min(2).max(60),
  channel: z.enum(["email", "sms", "whatsapp", "inapp"]),
  subject: z.string().trim().max(160),
  body: z.string().trim().max(2000),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
