"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/demo-store";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/catalog";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PASSWORD_VERIFICATION_COOKIE, PASSWORD_VERIFICATION_MAX_AGE } from "@/lib/password-verification";
import { addressSchema, contactSchema, feedbackSchema, profileSchema, returnSchema, reviewSchema } from "@/lib/validation";
import { releaseDemoOrder } from "@/lib/orders";
import type { ReturnRequest, Review, SiteFeedback } from "@/lib/types";

export interface FormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

function flattenZod(error: {
  flatten: () => { fieldErrors: Record<string, string[]>; formErrors: string[] };
}): FormState {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages?.[0]) fieldErrors[key] = messages[0];
  }
  return {
    error: flattened.formErrors[0] ?? Object.values(fieldErrors)[0] ?? "Please check the form.",
    fieldErrors,
  };
}

export async function toggleWishlistAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { loginRequired: true as const, error: "Log in to save plants to your wishlist." };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data: existing } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();
    if (existing) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
    }
    revalidatePath("/wishlist");
    revalidatePath("/account");
    return { wishlisted: !existing, loginRequired: false as const };
  }

  const db = getDb();
  const current = db.wishlists[user.id] ?? [];
  const exists = current.includes(productId);
  db.wishlists[user.id] = exists ? current.filter((id) => id !== productId) : [productId, ...current];
  revalidatePath("/wishlist");
  revalidatePath("/account");
  return { wishlisted: !exists, loginRequired: false as const };
}

export async function recordProductViewAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.from("recently_viewed").upsert(
      { user_id: user.id, product_id: productId, viewed_at: new Date().toISOString() },
      { onConflict: "user_id,product_id" },
    );
    const { data } = await supabase
      .from("recently_viewed")
      .select("product_id, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false });
    const stale = (data ?? []).slice(10);
    if (stale.length) {
      await supabase
        .from("recently_viewed")
        .delete()
        .eq("user_id", user.id)
        .in("product_id", stale.map((row) => row.product_id));
    }
    return { ok: true };
  }
  const db = getDb();
  const current = (db.recentlyViewed[user.id] ?? []).filter((row) => row.productId !== productId);
  db.recentlyViewed[user.id] = [{ productId, viewedAt: new Date().toISOString() }, ...current].slice(0, 10);
  return { ok: true };
}

/* ------------------------------- Addresses -------------------------------- */

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  const parsed = addressSchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    name: formData.get("name"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    is_default: formData.get("is_default") === "on",
  });
  if (!parsed.success) return flattenZod(parsed.error);
  const data = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (data.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }
    if (data.id) {
      const { error } = await supabase
        .from("addresses")
        .update({
          name: data.name,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          is_default: Boolean(data.is_default),
        })
        .eq("id", data.id)
        .eq("user_id", user.id);
      if (error) return { error: "Could not update this address." };
    } else {
      const { count } = await supabase
        .from("addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        is_default: Boolean(data.is_default) || (count ?? 0) === 0,
      });
      if (error) return { error: "Could not save this address." };
    }
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { success: "Address saved." };
  }

  const db = getDb();
  if (data.is_default) {
    db.addresses.filter((a) => a.user_id === user.id).forEach((a) => (a.is_default = false));
  }
  if (data.id) {
    const existing = db.addresses.find((a) => a.id === data.id && a.user_id === user.id);
    if (!existing) return { error: "Address not found." };
    Object.assign(existing, {
      name: data.name,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      is_default: Boolean(data.is_default) || existing.is_default,
    });
  } else {
    const isFirst = !db.addresses.some((a) => a.user_id === user.id);
    db.addresses.push({
      id: `a-${Date.now()}`,
      user_id: user.id,
      name: data.name,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      is_default: Boolean(data.is_default) || isFirst,
    });
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: "Address saved." };
}

export async function deleteAddressAction(addressId: string): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("user_id", user.id);
    if (error) return { error: "Could not delete this address." };
  } else {
    const db = getDb();
    db.addresses = db.addresses.filter((a) => !(a.id === addressId && a.user_id === user.id));
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: "Address removed." };
}

export async function setDefaultAddressAction(addressId: string): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("user_id", user.id);
    if (error) return { error: "Could not update the default address." };
  } else {
    getDb()
      .addresses.filter((a) => a.user_id === user.id)
      .forEach((a) => (a.is_default = a.id === addressId));
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: "Default address updated." };
}

/* -------------------------------- Profile --------------------------------- */

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return flattenZod(parsed.error);

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
      .eq("id", user.id);
    if (error) return { error: "Could not update your profile." };
  } else {
    const dbUser = getDb().users.find((u) => u.id === user.id);
    if (!dbUser) return { error: "Profile not found." };
    dbUser.full_name = parsed.data.full_name;
    dbUser.phone = parsed.data.phone || null;
    if (user.role === "admin") {
      const admin = getDb().users.find((u) => u.id === "u2");
      if (admin) admin.full_name = parsed.data.full_name;
    }
  }
  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: "Profile updated." };
}

export async function updatePreferencesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/settings");
  const preferences = {
    email: formData.get("email_notifications") === "on",
    whatsapp: formData.get("whatsapp_notifications") === "on",
    sms: formData.get("sms_notifications") === "on",
  };
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.updateUser({ data: { notifications: preferences } });
    if (error) return { error: "Could not save notification preferences." };
  } else {
    getDb().preferences[user.id] = preferences;
  }
  revalidatePath("/account/settings");
  return { success: "Notification preferences saved." };
}

/* --------------------------- Password verification -------------------------- */

/**
 * Step 1 of the password change: confirm the email on the account.
 * Sets a short-lived httpOnly cookie and sends the visitor to the form.
 */
export async function verifyPasswordEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile/password");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) return { error: "Enter the email address on this account." };
  if (email !== user.email.trim().toLowerCase()) {
    return { error: "That email doesn't match the one on this account." };
  }

  const jar = await cookies();
  jar.set(PASSWORD_VERIFICATION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/account/profile/password",
    maxAge: PASSWORD_VERIFICATION_MAX_AGE,
  });

  redirect("/account/profile/password/change");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const current = String(formData.get("current_password") || "");
  const next = String(formData.get("new_password") || "");
  const confirm = String(formData.get("confirm_password") || "");
  if (next.length < 8) return { error: "Use at least 8 characters for the new password." };
  if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next))
    return { error: "Include at least one letter and one number." };
  if (next !== confirm) return { error: "New passwords do not match." };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (verifyError) return { error: "Your current password is incorrect." };
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return { error: error.message };
  } else {
    const db = getDb();
    if (db.passwords[user.email] !== current) return { error: "Your current password is incorrect." };
    db.passwords[user.email] = next;
  }
  // Keep the verification cookie until it expires on its own — deleting it here
  // would make the server re-render bounce straight back to the email step.
  return { success: "Password updated." };
}

/* ------------------------------ Delete account ----------------------------- */

/**
 * Permanently deletes the signed-in user's account.
 *
 * The DB schema references profiles(id) with ON DELETE CASCADE on every
 * user-owned table (orders, order items, addresses, wishlists, carts,
 * recently viewed, reviews, loyalty and notifications), so deleting the auth
 * user removes all personal data in one step. The browser session is signed
 * out first, then the visitor is bounced to the storefront home page.
 */
export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser("/account/profile");

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
    const { error } = await createAdminSupabase().auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[account] delete user failed:", error.message);
      throw new Error("Could not delete your account right now. Please contact support.");
    }
  } else {
    // Demo store: drop the user and their personal entries (dev-only data).
    const db = getDb();
    db.users = db.users.filter((dbUser) => dbUser.id !== user.id);
    delete db.passwords[user.email];
    delete db.wishlists[user.id];
    delete db.recentlyViewed[user.id];
    delete db.preferences[user.id];
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/* ------------------------------- Notifications --------------------------- */

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser("/account");
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  } else {
    getDb()
      .notifications.filter((n) => n.user_id === user.id)
      .forEach((n) => (n.is_read = true));
  }
  revalidatePath("/account");
  revalidatePath("/account/notifications");
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await requireUser("/account");
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  } else {
    const notification = getDb().notifications.find((n) => n.id === id && n.user_id === user.id);
    if (notification) notification.is_read = true;
  }
  revalidatePath("/account/notifications");
}

/** Marks the admin's command-center notifications read and refreshes admin views. */
export async function markAdminNotificationsReadAction(): Promise<void> {
  const user = await requireUser("/admin");
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  } else {
    getDb()
      .notifications.filter((n) => n.user_id === user.id)
      .forEach((n) => (n.is_read = true));
  }
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

/* --------------------------------- Orders --------------------------------- */

export async function cancelOrderAction(orderId: string): Promise<FormState> {
  const user = await requireUser("/account/orders");
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
    if (error) return { error: error.message || "This order can no longer be cancelled." };
  } else {
    const db = getDb();
    const order = db.orders.find((o) => o.id === orderId && o.user_id === user.id);
    if (!order) return { error: "Order not found." };
    if (!["processing", "packed"].includes(order.status))
      return { error: "This order can no longer be cancelled — it is already on its way." };
    order.status = "cancelled";
    releaseDemoOrder(order, "Cancelled by customer before dispatch.");
    db.notifications.unshift({
      id: `n-${Date.now()}`,
      user_id: user.id,
      type: "order",
      title: "Order cancelled",
      body: `${order.order_number} has been cancelled. Any online payment is refunded within 5–7 business days.`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }
  revalidatePath("/account");
  revalidatePath("/account/orders");
  return { success: "Order cancelled. Refunds for online payments arrive within 5–7 business days." };
}

/* --------------------------------- Returns -------------------------------- */

async function storeReturnPhotos(files: File[], userId: string) {
  const paths: string[] = [];
  if (!isSupabaseConfigured()) return paths;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const admin = createAdminSupabase();
  for (const file of files.slice(0, 3)) {
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) continue;
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await admin.storage.from("returns").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (!error) paths.push(path);
  }
  return paths;
}

export async function requestReturnAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/orders");
  const parsed = returnSchema.safeParse({
    order_id: formData.get("order_id"),
    order_item_id: formData.get("order_item_id"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return flattenZod(parsed.error);

  const settings = await getSettings();

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, created_at")
      .eq("id", parsed.data.order_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!order) return { error: "Order not found." };
    if (order.status !== "delivered") return { error: "Returns can be requested after delivery." };
    const deliveredAt = new Date(order.created_at);
    const windowEnd = new Date(deliveredAt.getTime() + settings.return_window_days * 86400_000);
    if (windowEnd < new Date())
      return { error: `The ${settings.return_window_days}-day return window for this order has closed.` };
    const { data: item } = await supabase
      .from("order_items")
      .select("id, order_id, name")
      .eq("id", parsed.data.order_item_id)
      .eq("order_id", order.id)
      .maybeSingle();
    if (!item) return { error: "That item is not part of this order." };

    const files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const photoPaths = await storeReturnPhotos(files, user.id);
    const { error } = await supabase.from("return_requests").insert({
      order_id: order.id,
      order_item_id: item.id,
      user_id: user.id,
      reason: parsed.data.reason,
      photo_urls: photoPaths,
      status: "requested",
    });
    if (error) return { error: "Could not submit this return request." };
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "return",
      title: "Return request received",
      body: `We've received your return request for ${item.name}. Our team will review it within 24 hours.`,
    });
  } else {
    const db = getDb();
    const order = db.orders.find((o) => o.id === parsed.data.order_id && o.user_id === user.id);
    if (!order) return { error: "Order not found." };
    if (order.status !== "delivered") return { error: "Returns can be requested after delivery." };
    const item = order.items.find((entry) => entry.id === parsed.data.order_item_id);
    if (!item) return { error: "That item is not part of this order." };
    const request: ReturnRequest = {
      id: `ret-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      order_item_id: item.id,
      product_name: item.name,
      customer_name: user.full_name,
      reason: parsed.data.reason,
      photo_urls: [],
      status: "requested",
      admin_note: null,
      created_at: new Date().toISOString(),
    };
    db.returns.unshift(request);
    db.notifications.unshift({
      id: `n-${Date.now()}`,
      user_id: user.id,
      type: "return",
      title: "Return request received",
      body: `We've received your return request for ${item.name}. Our team will review it within 24 hours.`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }
  revalidatePath("/account/orders");
  return { success: "Return request submitted. We'll email you once it has been reviewed." };
}

/* --------------------------------- Reviews -------------------------------- */

export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/orders");
  const parsed = reviewSchema.safeParse({
    product_id: formData.get("product_id"),
    order_id: formData.get("order_id"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return flattenZod(parsed.error);

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, order_items(product_id)")
      .eq("id", parsed.data.order_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!order || order.status !== "delivered")
      return { error: "Reviews can be written once your order is delivered." };
    const items = (order.order_items ?? []) as { product_id: string }[];
    if (!items.some((item) => item.product_id === parsed.data.product_id))
      return { error: "This product is not in that order." };
    const { error } = await supabase.from("reviews").insert({
      product_id: parsed.data.product_id,
      user_id: user.id,
      customer_name: user.full_name || "Verified buyer",
      order_id: order.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      is_approved: false,
    });
    if (error) return { error: error.message.includes("duplicate") ? "You've already reviewed this product." : "Could not submit your review." };
  } else {
    const db = getDb();
    const order = db.orders.find((o) => o.id === parsed.data.order_id && o.user_id === user.id);
    if (!order || order.status !== "delivered")
      return { error: "Reviews can be written once your order is delivered." };
    if (!order.items.some((item) => item.product_id === parsed.data.product_id))
      return { error: "This product is not in that order." };
    if (db.reviews.some((r) => r.user_id === user.id && r.product_id === parsed.data.product_id))
      return { error: "You've already reviewed this product." };
    const review: Review = {
      id: `r-${Date.now()}`,
      product_id: parsed.data.product_id,
      product_name: order.items.find((item) => item.product_id === parsed.data.product_id)?.name,
      user_id: user.id,
      customer_name: user.full_name,
      order_id: order.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      is_approved: false,
      created_at: new Date().toISOString(),
    };
    db.reviews.unshift(review);
  }
  revalidatePath("/account/orders");
  return { success: "Thank you! Your review is with our team and will appear once approved." };
}

/** Update a customer's own review — goes back to "pending approval" so moderation still applies. */
export async function updateReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/reviews");
  const reviewId = String(formData.get("review_id") ?? "");
  const rating = Math.round(Number(formData.get("rating") ?? 0));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!reviewId) return { error: "Review not found." };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { fieldErrors: { rating: "Pick a rating between 1 and 5." } };
  }
  if (comment.length < 10) return { fieldErrors: { comment: "Tell us a bit more — at least 10 characters." } };
  if (comment.length > 800) return { fieldErrors: { comment: "Please keep it under 800 characters." } };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("reviews")
      .update({ rating, comment, is_approved: false })
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .select("id");
    if (error) return { error: "Could not update your review." };
    if (!data || data.length === 0) return { error: "Review not found." };
  } else {
    const db = getDb();
    const review = db.reviews.find((r) => r.id === reviewId && r.user_id === user.id);
    if (!review) return { error: "Review not found." };
    review.rating = rating;
    review.comment = comment;
    review.is_approved = false;
  }
  revalidatePath("/account/reviews");
  return { success: "Review updated! It will appear on the product page once re-approved." };
}

/** Remove a customer's own review permanently. */
export async function deleteReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/reviews");
  const reviewId = String(formData.get("review_id") ?? "");
  if (!reviewId) return { error: "Review not found." };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
    if (error) return { error: "Could not remove your review." };
  } else {
    const db = getDb();
    db.reviews = db.reviews.filter((r) => !(r.id === reviewId && r.user_id === user.id));
  }
  revalidatePath("/account/reviews");
  return { success: "Your review was removed." };
}

/* --------------------------------- Contact -------------------------------- */

export async function submitContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });
  if (!parsed.success) return flattenZod(parsed.error);

  const { name, email, topic, message } = parsed.data;

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminSupabase();
      await admin.from("contact_messages").insert({
        name,
        email,
        topic,
        message,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Best effort table insert, return success to customer
    }
  } else {
    const db = getDb();
    db.notifications.unshift({
      id: `n-contact-${Date.now()}`,
      user_id: "u2", // notify admin
      type: "system",
      title: `New message: ${topic}`,
      body: `${name} (${email}): ${message.slice(0, 120)}...`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  return { success: `Thank you, ${name.split(" ")[0]}! We have received your message and will reply to ${email} within one business day.` };
}

/* ---------------------------- Website feedback ----------------------------- */

/**
 * Post-order website feedback — a star rating plus an optional improvements
 * note. Shown on the checkout confirmation page right after an order completes.
 */
export async function submitWebsiteFeedbackAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to share your feedback." };

  const parsed = feedbackSchema.safeParse({
    order_id: (formData.get("order_id") as string) || undefined,
    rating: formData.get("rating"),
    improvements: ((formData.get("improvements") as string) || "").trim() || undefined,
  });
  if (!parsed.success) return flattenZod(parsed.error);

  const { order_id, rating, improvements } = parsed.data;
  const firstName = user.full_name.split(" ")[0];

  const thanksByRating =
    rating >= 5
      ? "Thank you, " + firstName + "! We're delighted your leaf journey is off to a great start — that five-star feeling is exactly what we grow for."
      : rating === 4
        ? "Thank you, " + firstName + "! So glad you enjoyed it — and we're always reaching for greener."
        : "Thank you for being honest, " + firstName + "! Your notes go straight to our small team, and we're already on it.";

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("site_feedback").insert({
      user_id: user.id,
      order_id: order_id ?? null,
      rating,
      improvements: improvements ?? null,
    });
    if (error) {
      // The survey table may not exist yet (migration 0007 pending). Keep the
      // customer unblocked by recording the feedback in their notifications.
      console.error("[feedback] site_feedback insert failed", error.message);
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: user.id,
        type: "feedback",
        title: `Website feedback — ${rating} star${rating > 1 ? "s" : ""}`,
        body: improvements ? `${thanksByRating} Note: "${improvements}"` : thanksByRating,
      });
      if (notifyError) {
        console.error("[feedback] notification fallback failed", notifyError.message);
        return { error: "We couldn't save your feedback. Please try again." };
      }
      return { success: thanksByRating };
    }
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "feedback",
      title: "Thanks for your feedback",
      body: thanksByRating,
    });
  } else {
    const db = getDb();
    const feedback: SiteFeedback = {
      id: `fb-${Date.now()}`,
      user_id: user.id,
      order_id: order_id ?? null,
      rating,
      improvements: improvements ?? null,
      created_at: new Date().toISOString(),
    };
    db.siteFeedback.push(feedback);
    db.notifications.unshift({
      id: `n-${feedback.id}`,
      user_id: user.id,
      type: "feedback",
      title: "Thanks for your feedback",
      body: thanksByRating,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  return { success: thanksByRating };
}

