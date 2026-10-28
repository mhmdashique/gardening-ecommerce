"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  bannerSchema,
  categorySchema,
  couponSchema,
  loyaltyAdjustSchema,
  orderStatusSchema,
  productSchema,
  returnStatusSchema,
  settingsSchema,
  zoneSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { awardLoyaltyForOrder, releaseDemoOrder } from "@/lib/orders";
import type { Product, ProductVariant, SiteSettings } from "@/lib/types";

export interface AdminFormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const initialError = "Please check the highlighted fields.";

function flatten(error: {
  flatten: () => { fieldErrors: Record<string, string[]>; formErrors: string[] };
}): AdminFormState {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages?.[0]) fieldErrors[key] = messages[0];
  }
  return {
    error: flattened.formErrors[0] ?? Object.values(fieldErrors)[0] ?? initialError,
    fieldErrors,
  };
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateStore() {
  revalidateTag("catalog");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

/* -------------------------------- Products -------------------------------- */

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();

  let variants: unknown = [];
  try {
    variants = JSON.parse(text(formData, "variants") || "[]");
  } catch {
    return { error: "Variants could not be read. Please re-enter the sizes and try again." };
  }

  const parsed = productSchema.safeParse({
    id: text(formData, "id") || undefined,
    name: text(formData, "name"),
    slug: text(formData, "slug") || slugify(text(formData, "name")),
    description: text(formData, "description"),
    category_id: text(formData, "category_id"),
    badge: text(formData, "badge") || undefined,
    light: text(formData, "light"),
    water: text(formData, "water"),
    difficulty: text(formData, "difficulty"),
    pet_friendly: checked(formData, "pet_friendly"),
    air_purifying: checked(formData, "air_purifying"),
    is_best_seller: checked(formData, "is_best_seller"),
    is_active: checked(formData, "is_active"),
    care_guide: text(formData, "care_guide") || undefined,
    images: text(formData, "images") || undefined,
    variants,
  });
  if (!parsed.success) return flatten(parsed.error);
  const data = parsed.data;
  const imageList = (data.images ?? "")
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const badge = data.badge ? data.badge : null;

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const productPayload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      short_description: data.description.slice(0, 140),
      category_id: data.category_id,
      badge,
      light: data.light,
      water: data.water,
      difficulty: data.difficulty,
      pet_friendly: Boolean(data.pet_friendly),
      air_purifying: Boolean(data.air_purifying),
      is_best_seller: Boolean(data.is_best_seller),
      is_active: Boolean(data.is_active),
      care_guide: data.care_guide || null,
    };

    let productId = data.id;
    if (productId) {
      const { error } = await admin.from("products").update(productPayload).eq("id", productId);
      if (error) {
        return {
          error: error.message.includes("duplicate")
            ? "That slug is already used by another product."
            : "Could not update the product.",
        };
      }
    } else {
      const { data: inserted, error } = await admin.from("products").insert(productPayload).select("id").single();
      if (error || !inserted) {
        return {
          error: error?.message.includes("duplicate")
            ? "That slug is already used by another product."
            : "Could not create the product.",
        };
      }
      productId = String(inserted.id);
    }

    if (imageList.length) {
      await admin.from("product_images").delete().eq("product_id", productId);
      await admin.from("product_images").insert(
        imageList.map((url, index) => ({ product_id: productId, url, sort_order: index })),
      );
    }

    const keptIds: string[] = [];
    for (const variant of data.variants) {
      const payload = {
        product_id: productId,
        sku: variant.sku,
        size: variant.size,
        pot_type: variant.pot_type,
        price: variant.price,
        compare_at_price: variant.compare_at_price && variant.compare_at_price > 0 ? variant.compare_at_price : null,
        stock: variant.stock,
        low_stock_threshold: variant.low_stock_threshold ?? 5,
        is_active: variant.is_active !== false,
      };
      if (variant.id) {
        const { error } = await admin.from("product_variants").update(payload).eq("id", variant.id);
        if (error) return { error: `Could not update the ${variant.size} size: ${error.message}` };
        keptIds.push(variant.id);
      } else {
        const { data: inserted, error } = await admin.from("product_variants").insert(payload).select("id").single();
        if (error || !inserted) return { error: `Could not add the ${variant.size} size.` };
        keptIds.push(String(inserted.id));
      }
    }
    if (keptIds.length) {
      await admin.from("product_variants").update({ is_active: false }).eq("product_id", productId).not("id", "in", `(${keptIds.join(",")})`);
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/product/${data.slug}`);
    revalidateStore();
    return { success: data.id ? "Product updated." : "Product created." };
  }

  const db = getDb();
  const category = db.categories.find((entry) => entry.id === data.category_id);
  if (!category) return { error: "Choose a valid category." };
  const existing = data.id ? db.products.find((entry) => entry.id === data.id) : null;
  if (data.id && !existing) return { error: "Product not found." };

  const productId = existing?.id ?? `p-${Date.now()}`;
  const nextVariants: ProductVariant[] = data.variants.map((variant, index) => ({
    id: variant.id || `${productId}-v${Date.now()}-${index}`,
    product_id: productId,
    sku: variant.sku,
    size: variant.size,
    pot_type: variant.pot_type,
    price: variant.price,
    compare_at_price: variant.compare_at_price && variant.compare_at_price > 0 ? variant.compare_at_price : null,
    stock: variant.stock,
    low_stock_threshold: variant.low_stock_threshold ?? 5,
    is_active: variant.is_active !== false,
  }));

  const product: Product = {
    id: productId,
    name: data.name,
    slug: data.slug,
    description: data.description,
    short_description: data.description.slice(0, 140),
    category_id: category.id,
    category_name: category.name,
    category_slug: category.slug,
    badge,
    is_active: Boolean(data.is_active),
    is_best_seller: Boolean(data.is_best_seller),
    light: data.light,
    water: data.water,
    difficulty: data.difficulty,
    pet_friendly: Boolean(data.pet_friendly),
    air_purifying: Boolean(data.air_purifying),
    care_guide: data.care_guide || null,
    rating: existing?.rating ?? 4.7,
    review_count: existing?.review_count ?? 0,
    images: imageList.length ? imageList : (existing?.images ?? ["/images/plant-placeholder.svg"]),
    variants: nextVariants,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, product);
  } else {
    if (db.products.some((entry) => entry.slug === data.slug)) {
      return { error: "That slug is already used by another product." };
    }
    db.products.unshift(product);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/product/${data.slug}`);
  revalidateStore();
  return { success: existing ? "Product updated." : "Product created." };
}

export async function deleteProductAction(productId: string): Promise<AdminFormState> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = await admin.from("products").update({ is_active: false }).eq("id", productId);
    if (error) return { error: "Could not archive this product." };
  } else {
    const product = getDb().products.find((entry) => entry.id === productId);
    if (!product) return { error: "Product not found." };
    product.is_active = false;
  }
  revalidatePath("/admin/products");
  revalidateStore();
  return { success: "Product archived. It will no longer appear in the store." };
}

export async function toggleProductActiveAction(productId: string, active: boolean): Promise<AdminFormState> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = await admin.from("products").update({ is_active: active }).eq("id", productId);
    if (error) return { error: "Could not update the product." };
  } else {
    const product = getDb().products.find((entry) => entry.id === productId);
    if (!product) return { error: "Product not found." };
    product.is_active = active;
  }
  revalidatePath("/admin/products");
  revalidateStore();
  return { success: active ? "Product is live." : "Product hidden from the store." };
}

/* ------------------------------- Categories ------------------------------- */

export async function saveCategoryAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: text(formData, "id") || undefined,
    name: text(formData, "name"),
    slug: text(formData, "slug") || slugify(text(formData, "name")),
    description: text(formData, "description") || undefined,
    image_url: text(formData, "image_url") || "",
    icon: text(formData, "icon") || undefined,
    sort_order: text(formData, "sort_order") || 0,
    is_active: checked(formData, "is_active"),
  });
  if (!parsed.success) return flatten(parsed.error);
  const data = parsed.data;

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image_url: data.image_url || null,
      icon: data.icon || null,
      sort_order: data.sort_order ?? 0,
      is_active: Boolean(data.is_active),
    };
    const { error } = data.id
      ? await admin.from("categories").update(payload).eq("id", data.id)
      : await admin.from("categories").insert(payload);
    if (error) {
      return { error: error.message.includes("duplicate") ? "That category slug is already in use." : "Could not save the category." };
    }
  } else {
    const db = getDb();
    if (data.id) {
      const category = db.categories.find((entry) => entry.id === data.id);
      if (!category) return { error: "Category not found." };
      Object.assign(category, {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: data.image_url || null,
        icon: data.icon || null,
        sort_order: data.sort_order ?? 0,
        is_active: Boolean(data.is_active),
      });
    } else {
      if (db.categories.some((entry) => entry.slug === data.slug)) return { error: "That category slug is already in use." };
      db.categories.push({
        id: `c-${Date.now()}`,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: data.image_url || null,
        icon: data.icon || null,
        parent_id: null,
        sort_order: data.sort_order ?? 0,
        is_active: Boolean(data.is_active),
      });
    }
  }
  revalidateTag("catalog");
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: data.id ? "Category saved." : "Category created." };
}

export async function toggleCategoryAction(categoryId: string, active: boolean): Promise<AdminFormState> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = await admin.from("categories").update({ is_active: active }).eq("id", categoryId);
    if (error) return { error: "Could not update the category." };
  } else {
    const category = getDb().categories.find((entry) => entry.id === categoryId);
    if (!category) return { error: "Category not found." };
    category.is_active = active;
  }
  revalidateTag("catalog");
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: active ? "Category is live." : "Category hidden." };
}

/* --------------------------------- Orders --------------------------------- */

async function notifyCustomer(userId: string, title: string, body: string, type = "order") {
  if (isSupabaseConfigured()) {
    await createAdminSupabase().from("notifications").insert({ user_id: userId, type, title, body });
    return;
  }
  getDb().notifications.unshift({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    user_id: userId,
    type,
    title,
    body,
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

export async function updateOrderStatusAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const adminUser = await requireAdmin();
  const parsed = orderStatusSchema.safeParse({
    order_id: text(formData, "order_id"),
    status: text(formData, "status"),
    note: text(formData, "note") || undefined,
    tracking_number: text(formData, "tracking_number") || undefined,
    courier: text(formData, "courier") || undefined,
  });
  if (!parsed.success) return flatten(parsed.error);
  const data = parsed.data;

  let orderUserId = "";
  let orderNumber = "";
  let cancelled = false;

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data: existing } = await admin
      .from("orders")
      .select("status, user_id, order_number")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!existing) return { error: "Order not found." };
    orderUserId = String(existing.user_id ?? "");
    orderNumber = String(existing.order_number ?? "");

    if (data.status === "cancelled" && existing.status !== "cancelled") {
      // cancel_order restores stock, releases the coupon and reverses loyalty atomically.
      const { error } = await admin.rpc("cancel_order", { p_order_id: data.order_id });
      if (error) return { error: error.message || "Could not cancel this order." };
      cancelled = true;
    } else {
      const updatePayload: Record<string, unknown> = { status: data.status, updated_at: new Date().toISOString() };
      if (data.tracking_number) updatePayload.tracking_number = data.tracking_number;
      if (data.courier) updatePayload.courier = data.courier;
      if (data.status === "delivered") updatePayload.payment_status = "paid";
      const { error } = await admin.from("orders").update(updatePayload).eq("id", data.order_id);
      if (error) return { error: "Could not update the order status." };
      await admin.from("order_status_history").insert({
        order_id: data.order_id,
        status: data.status,
        note: data.note || null,
        changed_by: adminUser.full_name,
      });
    }
  } else {
    const order = getDb().orders.find((entry) => entry.id === data.order_id);
    if (!order) return { error: "Order not found." };
    orderUserId = order.user_id;
    orderNumber = order.order_number;
    const cancelling = data.status === "cancelled" && order.status !== "cancelled";

    order.status = data.status;
    if (data.tracking_number) order.tracking_number = data.tracking_number;
    if (data.courier) order.courier = data.courier;
    if (data.status === "delivered") order.payment_status = "paid";

    if (cancelling) {
      releaseDemoOrder(order, data.note || `Cancelled by ${adminUser.full_name}.`);
      cancelled = true;
    } else {
      order.updated_at = new Date().toISOString();
      order.status_history.push({
        id: `h-${Date.now()}`,
        status: data.status,
        note: data.note || null,
        changed_by: adminUser.full_name,
        created_at: new Date().toISOString(),
      });
    }
  }

  if (data.status === "delivered") {
    await awardLoyaltyForOrder(data.order_id);
  }

  const label = data.status.charAt(0).toUpperCase() + data.status.slice(1);
  if (orderUserId) {
    const body = cancelled
      ? `${orderNumber} has been cancelled. Any online payment is refunded within 5–7 business days.`
      : `Your order status is now ${label.toLowerCase()}${data.tracking_number ? `. Tracking ${data.tracking_number}` : "."}`;
    await notifyCustomer(orderUserId, `Order ${label.toLowerCase()}`, body);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.order_id}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${data.order_id}`);
  return { success: "Order status updated." };
}

/* --------------------------------- Returns -------------------------------- */

export async function updateReturnStatusAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = returnStatusSchema.safeParse({
    return_id: text(formData, "return_id"),
    status: text(formData, "status"),
    admin_note: text(formData, "admin_note") || undefined,
  });
  if (!parsed.success) return flatten(parsed.error);

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data: request, error } = await admin
      .from("return_requests")
      .update({ status: parsed.data.status, admin_note: parsed.data.admin_note || null })
      .eq("id", parsed.data.return_id)
      .select("user_id")
      .maybeSingle();
    if (error) return { error: "Could not update this return." };
    if (request?.user_id) {
      await notifyCustomer(
        String(request.user_id),
        `Return ${parsed.data.status}`,
        parsed.data.admin_note || `Your return request has been ${parsed.data.status}.`,
        "return",
      );
    }
  } else {
    const db = getDb();
    const request = db.returns.find((entry) => entry.id === parsed.data.return_id);
    if (!request) return { error: "Return request not found." };
    request.status = parsed.data.status;
    request.admin_note = parsed.data.admin_note || null;
    const order = db.orders.find((entry) => entry.id === request.order_id);
    await notifyCustomer(
      order?.user_id ?? "",
      `Return ${parsed.data.status}`,
      parsed.data.admin_note || `Your return request has been ${parsed.data.status}.`,
      "return",
    );
  }
  revalidatePath("/admin/returns");
  return { success: "Return updated." };
}

/* -------------------------------- Customers ------------------------------- */

export async function toggleCustomerBlockAction(userId: string, blocked: boolean): Promise<AdminFormState> {
  const adminUser = await requireAdmin();
  if (userId === adminUser.id) return { error: "You cannot block your own account." };

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (profile?.role === "admin") return { error: "Admin accounts cannot be blocked from here." };
    const { error } = await admin.from("profiles").update({ is_blocked: blocked }).eq("id", userId);
    if (error) return { error: "Could not update this customer." };
  } else {
    const target = getDb().users.find((entry) => entry.id === userId);
    if (!target) return { error: "Customer not found." };
    if (target.role === "admin") return { error: "Admin accounts cannot be blocked from here." };
    target.is_blocked = blocked;
  }
  revalidatePath("/admin/customers");
  return { success: blocked ? "Customer blocked." : "Customer unblocked." };
}

export async function adjustLoyaltyAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = loyaltyAdjustSchema.safeParse({
    user_id: text(formData, "user_id"),
    points: text(formData, "points"),
    note: text(formData, "note"),
  });
  if (!parsed.success) return flatten(parsed.error);

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("loyalty_points")
      .eq("id", parsed.data.user_id)
      .maybeSingle();
    if (profileError || !profile) return { error: "Customer not found." };
    const next = Math.max(0, Number(profile.loyalty_points ?? 0) + parsed.data.points);
    const { error } = await admin.from("profiles").update({ loyalty_points: next }).eq("id", parsed.data.user_id);
    if (error) return { error: "Could not adjust points." };
    await admin.from("loyalty_transactions").insert({
      user_id: parsed.data.user_id,
      points: parsed.data.points,
      type: "adjusted",
      note: parsed.data.note,
    });
  } else {
    const db = getDb();
    const user = db.users.find((entry) => entry.id === parsed.data.user_id);
    if (!user) return { error: "Customer not found." };
    user.loyalty_points = Math.max(0, user.loyalty_points + parsed.data.points);
    db.loyalty.unshift({
      id: `lt-${Date.now()}`,
      user_id: user.id,
      order_id: null,
      points: parsed.data.points,
      type: "adjusted",
      note: parsed.data.note,
      created_at: new Date().toISOString(),
    });
  }
  revalidatePath("/admin/customers");
  revalidatePath("/account/loyalty");
  return { success: "Loyalty points adjusted." };
}

/* --------------------------------- Reviews -------------------------------- */

async function recomputeProductRating(productId: string) {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data } = await admin.from("reviews").select("rating").eq("product_id", productId).eq("is_approved", true);
    const ratings = (data ?? []).map((row) => Number(row.rating));
    const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
    await admin
      .from("products")
      .update({ rating: Math.round(average * 10) / 10, review_count: ratings.length })
      .eq("id", productId);
    return;
  }
  const db = getDb();
  const product = db.products.find((entry) => entry.id === productId);
  if (!product) return;
  const ratings = db.reviews.filter((review) => review.product_id === productId && review.is_approved).map((review) => review.rating);
  product.review_count = ratings.length;
  product.rating = ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10 : 0;
}

export async function moderateReviewAction(reviewId: string, approved: boolean): Promise<AdminFormState> {
  await requireAdmin();
  let productId = "";
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("reviews")
      .update({ is_approved: approved })
      .eq("id", reviewId)
      .select("product_id")
      .maybeSingle();
    if (error) return { error: "Could not update this review." };
    productId = String(data?.product_id ?? "");
  } else {
    const review = getDb().reviews.find((entry) => entry.id === reviewId);
    if (!review) return { error: "Review not found." };
    review.is_approved = approved;
    productId = review.product_id;
  }
  if (productId) await recomputeProductRating(productId);
  revalidatePath("/admin/reviews");
  revalidateStore();
  return { success: approved ? "Review approved." : "Review hidden." };
}

export async function deleteReviewAction(reviewId: string): Promise<AdminFormState> {
  await requireAdmin();
  let productId = "";
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { data, error } = await admin.from("reviews").delete().eq("id", reviewId).select("product_id").maybeSingle();
    if (error) return { error: "Could not delete this review." };
    productId = String(data?.product_id ?? "");
  } else {
    const db = getDb();
    const review = db.reviews.find((entry) => entry.id === reviewId);
    if (!review) return { error: "Review not found." };
    productId = review.product_id;
    db.reviews = db.reviews.filter((entry) => entry.id !== reviewId);
  }
  if (productId) await recomputeProductRating(productId);
  revalidatePath("/admin/reviews");
  revalidateStore();
  return { success: "Review deleted." };
}

/* --------------------------------- Coupons -------------------------------- */

export async function saveCouponAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const maxDiscountRaw = text(formData, "max_discount");
  const usageLimitRaw = text(formData, "usage_limit");
  const parsed = couponSchema.safeParse({
    id: text(formData, "id") || undefined,
    code: text(formData, "code"),
    description: text(formData, "description") || undefined,
    type: text(formData, "type"),
    value: text(formData, "value"),
    min_order: text(formData, "min_order") || 0,
    max_discount: maxDiscountRaw || undefined,
    applies_to: text(formData, "applies_to") || "all",
    category_id: text(formData, "category_id") || undefined,
    first_order_only: checked(formData, "first_order_only"),
    starts_at: text(formData, "starts_at") || undefined,
    ends_at: text(formData, "ends_at") || undefined,
    usage_limit: usageLimitRaw || undefined,
    is_active: checked(formData, "is_active"),
  });
  if (!parsed.success) return flatten(parsed.error);
  const data = parsed.data;
  const payload = {
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    min_order: data.min_order,
    max_discount: data.max_discount ?? null,
    applies_to: data.applies_to,
    category_id: data.applies_to === "category" ? data.category_id || null : null,
    first_order_only: Boolean(data.first_order_only),
    starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
    ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
    usage_limit: data.usage_limit ?? null,
    is_active: Boolean(data.is_active),
  };

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = data.id
      ? await admin.from("coupons").update(payload).eq("id", data.id)
      : await admin.from("coupons").insert(payload);
    if (error) {
      return { error: error.message.includes("duplicate") ? "That coupon code already exists." : "Could not save the coupon." };
    }
  } else {
    const db = getDb();
    if (data.id) {
      const coupon = db.coupons.find((entry) => entry.id === data.id);
      if (!coupon) return { error: "Coupon not found." };
      const category = db.categories.find((entry) => entry.id === payload.category_id);
      Object.assign(coupon, payload, {
        used_count: coupon.used_count,
        category_name: category?.name ?? null,
      });
    } else {
      if (db.coupons.some((entry) => entry.code === data.code)) return { error: "That coupon code already exists." };
      db.coupons.unshift({
        id: `cp-${Date.now()}`,
        ...payload,
        used_count: 0,
        category_name: db.categories.find((entry) => entry.id === payload.category_id)?.name ?? null,
      });
    }
  }
  revalidatePath("/admin/coupons");
  revalidatePath("/cart");
  return { success: "Coupon saved." };
}

export async function deleteCouponAction(couponId: string): Promise<AdminFormState> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    const { error } = await createAdminSupabase().from("coupons").update({ is_active: false }).eq("id", couponId);
    if (error) return { error: "Could not disable this coupon." };
  } else {
    const coupon = getDb().coupons.find((entry) => entry.id === couponId);
    if (!coupon) return { error: "Coupon not found." };
    coupon.is_active = false;
  }
  revalidatePath("/admin/coupons");
  return { success: "Coupon disabled." };
}

/* --------------------------------- Banners -------------------------------- */

export async function saveBannerAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse({
    id: text(formData, "id") || undefined,
    placement: text(formData, "placement"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle") || undefined,
    eyebrow: text(formData, "eyebrow") || undefined,
    image_url: text(formData, "image_url") || "",
    cta_label: text(formData, "cta_label") || undefined,
    cta_url: text(formData, "cta_url") || undefined,
    is_active: checked(formData, "is_active"),
    sort_order: text(formData, "sort_order") || 0,
  });
  if (!parsed.success) return flatten(parsed.error);
  const data = parsed.data;
  const payload = {
    placement: data.placement,
    title: data.title,
    subtitle: data.subtitle || null,
    eyebrow: data.eyebrow || null,
    image_url: data.image_url || null,
    cta_label: data.cta_label || null,
    cta_url: data.cta_url || null,
    is_active: Boolean(data.is_active),
    sort_order: data.sort_order ?? 0,
  };

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = data.id
      ? await admin.from("banners").update(payload).eq("id", data.id)
      : await admin.from("banners").insert(payload);
    if (error) return { error: "Could not save the banner." };
  } else {
    const db = getDb();
    if (data.id) {
      const banner = db.banners.find((entry) => entry.id === data.id);
      if (!banner) return { error: "Banner not found." };
      Object.assign(banner, payload);
    } else {
      db.banners.push({ id: `b-${Date.now()}`, ...payload });
    }
  }
  revalidateTag("catalog");
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: "Banner saved." };
}

export async function deleteBannerAction(bannerId: string): Promise<AdminFormState> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    const { error } = await createAdminSupabase().from("banners").delete().eq("id", bannerId);
    if (error) return { error: "Could not delete this banner." };
  } else {
    const db = getDb();
    db.banners = db.banners.filter((entry) => entry.id !== bannerId);
  }
  revalidateTag("catalog");
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: "Banner removed." };
}

/* -------------------------------- Settings -------------------------------- */

export async function updateSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    store_name: text(formData, "store_name"),
    store_email: text(formData, "store_email"),
    store_phone: text(formData, "store_phone"),
    store_address: text(formData, "store_address"),
    gst_number: text(formData, "gst_number"),
    free_shipping_threshold: text(formData, "free_shipping_threshold"),
    delivery_charge: text(formData, "delivery_charge"),
    gst_percent: text(formData, "gst_percent"),
    return_window_days: text(formData, "return_window_days"),
    claim_window_hours: text(formData, "claim_window_hours"),
    loyalty_earn_rate: text(formData, "loyalty_earn_rate"),
    loyalty_redeem_rate: text(formData, "loyalty_redeem_rate"),
    loyalty_enabled: checked(formData, "loyalty_enabled"),
    cod_enabled: checked(formData, "cod_enabled"),
    online_payment_enabled: checked(formData, "online_payment_enabled"),
    low_stock_threshold: text(formData, "low_stock_threshold"),
  });
  if (!parsed.success) return flatten(parsed.error);
  const data = parsed.data;
  const loyaltyEnabled = Boolean(data.loyalty_enabled) && data.loyalty_earn_rate > 0 && data.loyalty_redeem_rate > 0;
  const next: SiteSettings = {
    ...data,
    store_tagline: text(formData, "store_tagline") || "Green Home. Happy You.",
    loyalty_enabled: loyaltyEnabled,
    cod_enabled: Boolean(data.cod_enabled),
    online_payment_enabled: Boolean(data.online_payment_enabled),
  };

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const rows = Object.entries(next).map(([key, value]) => ({ key, value }));
    const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) return { error: "Could not save store settings." };
  } else {
    Object.assign(getDb().settings, next);
  }
  revalidatePath("/admin/settings");
  revalidateStore();
  revalidatePath("/account");
  revalidatePath("/account/loyalty");
  return { success: "Store settings saved." };
}

export async function saveZoneAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = zoneSchema.safeParse({
    pincode: text(formData, "pincode"),
    is_serviceable: true,
    charge: text(formData, "charge"),
    estimated_days: text(formData, "estimated_days"),
  });
  if (!parsed.success) return flatten(parsed.error);
  const payload = {
    pincode: parsed.data.pincode,
    // Every pincode is delivered; zones only tune charge and ETA.
    is_serviceable: true,
    charge: parsed.data.charge,
    estimated_days: parsed.data.estimated_days,
  };

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    const { error } = await admin.from("delivery_zones").upsert(payload, { onConflict: "pincode" });
    if (error) return { error: "Could not save this delivery zone." };
  } else {
    const db = getDb();
    const existing = db.zones.find((zone) => zone.pincode === payload.pincode);
    if (existing) Object.assign(existing, payload);
    else db.zones.push(payload);
  }
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { success: "Delivery zone saved." };
}

export async function deleteZoneAction(pincode: string): Promise<AdminFormState> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    const { error } = await createAdminSupabase().from("delivery_zones").delete().eq("pincode", pincode);
    if (error) return { error: "Could not remove this zone." };
  } else {
    const db = getDb();
    db.zones = db.zones.filter((zone) => zone.pincode !== pincode);
  }
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { success: "Delivery zone removed." };
}
