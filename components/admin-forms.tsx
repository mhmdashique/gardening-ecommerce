"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  adjustLoyaltyAction,
  deleteBannerAction,
  deleteCouponAction,
  deleteProductAction,
  deleteReviewAction,
  deleteZoneAction,
  moderateReviewAction,
  saveBannerAction,
  saveCategoryAction,
  saveCouponAction,
  saveProductAction,
  saveZoneAction,
  toggleCategoryAction,
  toggleCustomerBlockAction,
  toggleProductActiveAction,
  updateOrderStatusAction,
  updateReturnStatusAction,
  updateSettingsAction,
  type AdminFormState,
} from "@/lib/actions/admin";
import { Modal } from "@/components/interactive";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  buttonClasses,
} from "@/components/ui";
import { cn, formatINR, slugify } from "@/lib/utils";
import type {
  Banner,
  Category,
  Coupon,
  DeliveryZone,
  Order,
  Product,
  ReturnRequest,
  Review,
  SiteSettings,
  User,
} from "@/lib/types";

const initial: AdminFormState = {};

function Alert({ state }: { state: AdminFormState }) {
  if (!state.error && !state.success) return null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-[12px] leading-relaxed",
        state.error ? "border-danger/20 bg-danger-soft text-danger-ink" : "border-success/20 bg-success-soft text-success-ink",
      )}
      role={state.error ? "alert" : "status"}
    >
      {state.error ?? state.success}
    </div>
  );
}

function Submit({ pending, children, className }: { pending: boolean; children: React.ReactNode; className?: string }) {
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {children}
    </Button>
  );
}

function RowAction({
  onClick,
  label,
  icon,
  tone = "neutral",
  confirm,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tone?: "neutral" | "danger" | "green";
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(onClick);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-semibold transition disabled:opacity-50",
        tone === "danger"
          ? "border-danger/20 text-danger hover:bg-danger-soft"
          : tone === "green"
            ? "border-forest-200 text-forest-700 hover:bg-leaf-mint"
            : "border-line text-forest-800 hover:bg-leaf-mint",
      )}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}
      {label}
    </button>
  );
}

/* --------------------------------- Product -------------------------------- */

interface VariantDraft {
  id?: string;
  sku: string;
  size: string;
  pot_type: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      pot_type: variant.pot_type,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      stock: variant.stock,
      low_stock_threshold: variant.low_stock_threshold,
      is_active: variant.is_active,
    })) ?? [
      {
        sku: "",
        size: "Medium",
        pot_type: "Nursery pot",
        price: 499,
        compare_at_price: null,
        stock: 10,
        low_stock_threshold: 5,
        is_active: true,
      },
    ],
  );

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.push("/admin/products");
      router.refresh();
    }
  }, [state.success, toast, router]);

  const variantsJson = useMemo(() => JSON.stringify(variants), [variants]);

  const updateVariant = (index: number, patch: Partial<VariantDraft>) =>
    setVariants((current) => current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));

  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="variants" value={variantsJson} />

      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Basics</h2>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Field label="Product name" htmlFor="product-name" error={state.fieldErrors?.name} required>
            <Input
              id="product-name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              required
            />
          </Field>
          <Field label="URL slug" htmlFor="product-slug" error={state.fieldErrors?.slug} hint="Lowercase letters, numbers and dashes." required>
            <Input
              id="product-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
            />
          </Field>
          <Field label="Category" htmlFor="product-category" error={state.fieldErrors?.category_id} required>
            <Select id="product-category" name="category_id" defaultValue={product?.category_id ?? ""} required>
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Badge" htmlFor="product-badge">
            <Select id="product-badge" name="badge" defaultValue={product?.badge ?? ""}>
              <option value="">No badge</option>
              <option value="Popular">Popular</option>
              <option value="Best Seller">Best Seller</option>
              <option value="New">New</option>
            </Select>
          </Field>
          <Field label="Short description" htmlFor="product-description" className="sm:col-span-2" error={state.fieldErrors?.description} required>
            <Textarea id="product-description" name="description" defaultValue={product?.description ?? ""} className="min-h-[110px]" required />
          </Field>
          <Field label="Care guide" htmlFor="product-care" className="sm:col-span-2" hint="Light, water and repotting notes shown on the product page.">
            <Textarea id="product-care" name="care_guide" defaultValue={product?.care_guide ?? ""} className="min-h-[90px]" />
          </Field>
          <Field
            label="Image URLs"
            htmlFor="product-images"
            className="sm:col-span-2"
            hint="One URL per line. First image is used as the main photo."
          >
            <Textarea id="product-images" name="images" defaultValue={(product?.images ?? []).join("\n")} className="min-h-[90px] font-mono text-[11px]" />
          </Field>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Plant details</h2>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
          <Field label="Light" htmlFor="product-light" required>
            <Select id="product-light" name="light" defaultValue={product?.light ?? "Medium"}>
              {["Low", "Medium", "Bright", "Full Sun"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </Field>
          <Field label="Water" htmlFor="product-water" required>
            <Select id="product-water" name="water" defaultValue={product?.water ?? "Medium"}>
              {["Low", "Medium", "High"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty" htmlFor="product-difficulty" required>
            <Select id="product-difficulty" name="difficulty" defaultValue={product?.difficulty ?? "Easy"}>
              {["Easy", "Moderate", "Expert"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <Checkbox name="pet_friendly" defaultChecked={product?.pet_friendly ?? false} label="Pet friendly" />
          <Checkbox name="air_purifying" defaultChecked={product?.air_purifying ?? false} label="Air purifying" />
          <Checkbox name="is_best_seller" defaultChecked={product?.is_best_seller ?? false} label="Mark as best seller" />
          <Checkbox name="is_active" defaultChecked={product?.is_active ?? true} label="Visible in the store" />
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-forest-950">Sizes & stock</h2>
            <p className="text-[11px] text-muted">Each size is sold as its own variant with its own stock.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setVariants((current) => [
                ...current,
                {
                  sku: "",
                  size: "",
                  pot_type: "Nursery pot",
                  price: 499,
                  compare_at_price: null,
                  stock: 10,
                  low_stock_threshold: 5,
                  is_active: true,
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add size
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id ?? index} className="rounded-xl border border-line p-3.5">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Field label="Size" htmlFor={`v-size-${index}`} required>
                  <Input id={`v-size-${index}`} value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} placeholder="Medium" required />
                </Field>
                <Field label="Pot type" htmlFor={`v-pot-${index}`} required>
                  <Input id={`v-pot-${index}`} value={variant.pot_type} onChange={(event) => updateVariant(index, { pot_type: event.target.value })} placeholder="Ceramic pot" required />
                </Field>
                <Field label="SKU" htmlFor={`v-sku-${index}`} required>
                  <Input id={`v-sku-${index}`} value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase() })} placeholder="LP-MON-M" required />
                </Field>
                <Field label="Price (₹)" htmlFor={`v-price-${index}`} required>
                  <Input id={`v-price-${index}`} type="number" min={1} value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} required />
                </Field>
                <Field label="Compare at (₹)" htmlFor={`v-compare-${index}`}>
                  <Input
                    id={`v-compare-${index}`}
                    type="number"
                    min={0}
                    value={variant.compare_at_price ?? ""}
                    onChange={(event) =>
                      updateVariant(index, { compare_at_price: event.target.value ? Number(event.target.value) : null })
                    }
                  />
                </Field>
                <Field label="Stock" htmlFor={`v-stock-${index}`} required>
                  <Input id={`v-stock-${index}`} type="number" min={0} value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} required />
                </Field>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  <Checkbox
                    checked={variant.is_active}
                    onChange={(event) => updateVariant(index, { is_active: event.target.checked })}
                    label="Available"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-muted">
                    Low stock alert at
                    <input
                      type="number"
                      min={0}
                      value={variant.low_stock_threshold}
                      onChange={(event) => updateVariant(index, { low_stock_threshold: Number(event.target.value) })}
                      className="h-8 w-16 rounded-lg border border-line px-2 text-[11px]"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}
                  disabled={variants.length === 1}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold text-danger hover:bg-danger-soft disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Submit pending={pending}>{product ? "Save product" : "Create product"}</Submit>
      </div>
    </form>
  );
}

export function ProductRowActions({ product }: { product: Product }) {
  const router = useRouter();
  const { toast } = useToast();
  const run = async (fn: () => Promise<AdminFormState>) => {
    const result = await fn();
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Updated.");
      router.refresh();
    }
  };
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <a href={`/admin/products/${product.id}`} className={buttonClasses({ variant: "secondary", size: "sm", className: "h-7 px-2 text-[10.5px]" })}>
        <Pencil className="h-3 w-3" /> Edit
      </a>
      <RowAction
        onClick={() => void run(() => toggleProductActiveAction(product.id, !product.is_active))}
        label={product.is_active ? "Hide" : "Publish"}
        icon={product.is_active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        tone={product.is_active ? "neutral" : "green"}
      />
      {product.is_active && (
        <RowAction
          onClick={() => void run(() => deleteProductAction(product.id))}
          label="Archive"
          icon={<Trash2 className="h-3 w-3" />}
          tone="danger"
          confirm="Archive this product? It will be hidden from the store."
        />
      )}
    </div>
  );
}

/* -------------------------------- Category -------------------------------- */

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [state, action, pending] = useActionState(saveCategoryAction, initial);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      setOpen(false);
      setEditing(undefined);
      router.refresh();
    }
  }, [state.success, toast, router]);

  const toggle = async (id: string, active: boolean) => {
    const result = await toggleCategoryAction(id, active);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Updated.");
      router.refresh();
    }
  };

  return (
    <div>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New category
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-semibold">Category</th>
              <th className="py-2 pr-3 font-semibold">Slug</th>
              <th className="py-2 pr-3 font-semibold">Products</th>
              <th className="py-2 pr-3 font-semibold">Order</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="py-3 pr-3">
                  <p className="font-semibold text-forest-950">{category.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">{category.description}</p>
                </td>
                <td className="py-3 pr-3 font-mono text-[10.5px] text-muted">{category.slug}</td>
                <td className="py-3 pr-3 text-forest-900">{category.product_count ?? 0}</td>
                <td className="py-3 pr-3 text-forest-900">{category.sort_order}</td>
                <td className="py-3 pr-3">
                  <Badge tone={category.is_active ? "green" : "neutral"}>{category.is_active ? "Live" : "Hidden"}</Badge>
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(category);
                        setOpen(true);
                      }}
                      className="rounded-lg border border-line px-2 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-leaf-mint"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggle(category.id, !category.is_active)}
                      className="rounded-lg border border-line px-2 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-leaf-mint"
                    >
                      {category.is_active ? "Hide" : "Show"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit category" : "New category"} size="md">
        <form key={editing?.id ?? "new"} action={action} className="space-y-3.5">
          <Alert state={state} />
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Name" htmlFor="cat-name" error={state.fieldErrors?.name} required>
              <Input id="cat-name" name="name" defaultValue={editing?.name ?? ""} required />
            </Field>
            <Field label="Slug" htmlFor="cat-slug" error={state.fieldErrors?.slug} required>
              <Input id="cat-slug" name="slug" defaultValue={editing?.slug ?? ""} placeholder="auto from name" />
            </Field>
            <Field label="Image URL" htmlFor="cat-image" className="sm:col-span-2" error={state.fieldErrors?.image_url}>
              <Input id="cat-image" name="image_url" defaultValue={editing?.image_url ?? ""} placeholder="https://…" />
            </Field>
            <Field label="Description" htmlFor="cat-description" className="sm:col-span-2">
              <Textarea id="cat-description" name="description" defaultValue={editing?.description ?? ""} className="min-h-[70px]" />
            </Field>
            <Field label="Sort order" htmlFor="cat-order">
              <Input id="cat-order" name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? 0} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox name="is_active" defaultChecked={editing?.is_active ?? true} label="Visible in store" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Submit pending={pending}>Save category</Submit>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* --------------------------------- Orders --------------------------------- */

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, initial);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);
  return (
    <form action={action} className="space-y-3">
      <Alert state={state} />
      <input type="hidden" name="order_id" value={order.id} />
      <Field label="Status" htmlFor="order-status" required>
        <Select id="order-status" name="status" defaultValue={order.status === "returned" ? "delivered" : order.status}>
          {["processing", "packed", "shipped", "delivered", "cancelled"].map((status) => (
            <option key={status} value={status} className="capitalize">{status}</option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Courier" htmlFor="order-courier">
          <Input id="order-courier" name="courier" defaultValue={order.courier ?? ""} placeholder="Delhivery" />
        </Field>
        <Field label="Tracking number" htmlFor="order-tracking">
          <Input id="order-tracking" name="tracking_number" defaultValue={order.tracking_number ?? ""} placeholder="DLV…" />
        </Field>
      </div>
      <Field label="Note for the customer" htmlFor="order-note" hint="Optional. Stored on the order timeline.">
        <Textarea id="order-note" name="note" className="min-h-[70px]" />
      </Field>
      <Submit pending={pending}>Update order</Submit>
    </form>
  );
}

/* --------------------------------- Returns -------------------------------- */

export function ReturnReviewForm({ request }: { request: ReturnRequest }) {
  const [state, action, pending] = useActionState(updateReturnStatusAction, initial);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);
  return (
    <form action={action} className="space-y-3">
      <Alert state={state} />
      <input type="hidden" name="return_id" value={request.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Decision" htmlFor={`return-status-${request.id}`} required>
          <Select id={`return-status-${request.id}`} name="status" defaultValue={request.status === "requested" ? "approved" : request.status}>
            {["approved", "rejected", "replaced", "refunded"].map((status) => (
              <option key={status} value={status} className="capitalize">{status}</option>
            ))}
          </Select>
        </Field>
        <Field label="Admin note" htmlFor={`return-note-${request.id}`}>
          <Input id={`return-note-${request.id}`} name="admin_note" defaultValue={request.admin_note ?? ""} placeholder="Visible to the customer" />
        </Field>
      </div>
      <Submit pending={pending}>Save decision</Submit>
    </form>
  );
}

/* -------------------------------- Customers ------------------------------- */

export function CustomerActions({ customer }: { customer: User }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [state, action, pending] = useActionState(adjustLoyaltyAction, initial);

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      setLoyaltyOpen(false);
      router.refresh();
    }
  }, [state.success, toast, router]);

  const toggleBlock = async () => {
    if (!window.confirm(customer.is_blocked ? "Unblock this customer?" : "Block this customer? They will not be able to shop.")) return;
    const result = await toggleCustomerBlockAction(customer.id, !customer.is_blocked);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Updated.");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setLoyaltyOpen(true)}
        className="rounded-lg border border-line px-2 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-leaf-mint"
      >
        Adjust points
      </button>
      {customer.role !== "admin" && (
        <button
          type="button"
          onClick={() => void toggleBlock()}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-semibold",
            customer.is_blocked
              ? "border-forest-200 text-forest-700 hover:bg-leaf-mint"
              : "border-danger/20 text-danger hover:bg-danger-soft",
          )}
        >
          <Ban className="h-3 w-3" /> {customer.is_blocked ? "Unblock" : "Block"}
        </button>
      )}

      <Modal open={loyaltyOpen} onClose={() => setLoyaltyOpen(false)} title={`Adjust points for ${customer.full_name}`} size="sm">
        <form action={action} className="space-y-3.5">
          <Alert state={state} />
          <input type="hidden" name="user_id" value={customer.id} />
          <p className="rounded-xl bg-leaf-mint px-3 py-2 text-[11.5px] text-forest-800">
            Current balance: <strong>{customer.loyalty_points}</strong> points
          </p>
          <Field label="Points" htmlFor="loyalty-points" hint="Use a negative number to deduct." required>
            <Input id="loyalty-points" name="points" type="number" defaultValue={50} required />
          </Field>
          <Field label="Reason" htmlFor="loyalty-note" required>
            <Input id="loyalty-note" name="note" placeholder="Goodwill for delayed delivery" required />
          </Field>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setLoyaltyOpen(false)}>Cancel</Button>
            <Submit pending={pending}>Apply adjustment</Submit>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* --------------------------------- Reviews -------------------------------- */

export function ReviewActions({ review }: { review: Review }) {
  const router = useRouter();
  const { toast } = useToast();
  const run = async (fn: () => Promise<AdminFormState>) => {
    const result = await fn();
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Updated.");
      router.refresh();
    }
  };
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {!review.is_approved ? (
        <RowAction onClick={() => void run(() => moderateReviewAction(review.id, true))} label="Approve" icon={<Check className="h-3 w-3" />} tone="green" />
      ) : (
        <RowAction onClick={() => void run(() => moderateReviewAction(review.id, false))} label="Hide" icon={<X className="h-3 w-3" />} />
      )}
      <RowAction
        onClick={() => void run(() => deleteReviewAction(review.id))}
        label="Delete"
        icon={<Trash2 className="h-3 w-3" />}
        tone="danger"
        confirm="Delete this review permanently?"
      />
    </div>
  );
}

/* --------------------------------- Coupons -------------------------------- */

export function CouponManager({ coupons, categories }: { coupons: Coupon[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | undefined>();
  const [state, action, pending] = useActionState(saveCouponAction, initial);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      setOpen(false);
      setEditing(undefined);
      router.refresh();
    }
  }, [state.success, toast, router]);

  return (
    <div>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> New coupon
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-semibold">Code</th>
              <th className="py-2 pr-3 font-semibold">Offer</th>
              <th className="py-2 pr-3 font-semibold">Min order</th>
              <th className="py-2 pr-3 font-semibold">Used</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="py-3 pr-3 font-mono text-[11px] font-semibold text-forest-950">{coupon.code}</td>
                <td className="py-3 pr-3">
                  <p className="font-medium text-forest-900">
                    {coupon.type === "percent" ? `${coupon.value}% off` : `${formatINR(coupon.value)} off`}
                    {coupon.category_name ? ` · ${coupon.category_name}` : ""}
                  </p>
                  <p className="text-[10.5px] text-muted">
                    {coupon.description}
                    {coupon.first_order_only ? " · First order only" : ""}
                  </p>
                </td>
                <td className="py-3 pr-3 text-forest-900">{formatINR(coupon.min_order)}</td>
                <td className="py-3 pr-3 text-forest-900">
                  {coupon.used_count}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                </td>
                <td className="py-3 pr-3">
                  <Badge tone={coupon.is_active ? "green" : "neutral"}>{coupon.is_active ? "Active" : "Off"}</Badge>
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setEditing(coupon); setOpen(true); }}
                      className="rounded-lg border border-line px-2 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-leaf-mint"
                    >
                      Edit
                    </button>
                    <RowAction
                      onClick={async () => {
                        const result = await deleteCouponAction(coupon.id);
                        if (result.error) toast(result.error, "error");
                        else {
                          toast(result.success ?? "Coupon disabled.");
                          router.refresh();
                        }
                      }}
                      label="Disable"
                      icon={<X className="h-3 w-3" />}
                      tone="danger"
                      confirm="Disable this coupon?"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.code}` : "New coupon"} size="md">
        <form key={editing?.id ?? "new"} action={action} className="space-y-3.5">
          <Alert state={state} />
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Coupon code" htmlFor="coupon-code" error={state.fieldErrors?.code} required>
              <Input id="coupon-code" name="code" defaultValue={editing?.code ?? ""} className="uppercase" required />
            </Field>
            <Field label="Type" htmlFor="coupon-type" required>
              <Select id="coupon-type" name="type" defaultValue={editing?.type ?? "percent"}>
                <option value="percent">Percentage off</option>
                <option value="flat">Flat amount off</option>
              </Select>
            </Field>
            <Field label="Value" htmlFor="coupon-value" hint="Percent or rupees, depending on type." required>
              <Input id="coupon-value" name="value" type="number" min={1} defaultValue={editing?.value ?? 10} required />
            </Field>
            <Field label="Minimum order (₹)" htmlFor="coupon-min" required>
              <Input id="coupon-min" name="min_order" type="number" min={0} defaultValue={editing?.min_order ?? 0} required />
            </Field>
            <Field label="Max discount (₹)" htmlFor="coupon-max">
              <Input id="coupon-max" name="max_discount" type="number" min={0} defaultValue={editing?.max_discount ?? ""} />
            </Field>
            <Field label="Usage limit" htmlFor="coupon-limit">
              <Input id="coupon-limit" name="usage_limit" type="number" min={1} defaultValue={editing?.usage_limit ?? ""} />
            </Field>
            <Field label="Applies to" htmlFor="coupon-applies" required>
              <Select id="coupon-applies" name="applies_to" defaultValue={editing?.applies_to ?? "all"}>
                <option value="all">All products</option>
                <option value="category">A category</option>
              </Select>
            </Field>
            <Field label="Category" htmlFor="coupon-category">
              <Select id="coupon-category" name="category_id" defaultValue={editing?.category_id ?? ""}>
                <option value="">Any category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Starts at" htmlFor="coupon-start">
              <Input id="coupon-start" name="starts_at" type="datetime-local" defaultValue={editing?.starts_at ? editing.starts_at.slice(0, 16) : ""} />
            </Field>
            <Field label="Ends at" htmlFor="coupon-end">
              <Input id="coupon-end" name="ends_at" type="datetime-local" defaultValue={editing?.ends_at ? editing.ends_at.slice(0, 16) : ""} />
            </Field>
            <Field label="Description" htmlFor="coupon-description" className="sm:col-span-2">
              <Input id="coupon-description" name="description" defaultValue={editing?.description ?? ""} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <Checkbox name="first_order_only" defaultChecked={editing?.first_order_only ?? false} label="First order only" />
            <Checkbox name="is_active" defaultChecked={editing?.is_active ?? true} label="Active" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Submit pending={pending}>Save coupon</Submit>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* --------------------------------- Banners -------------------------------- */

export function BannerManager({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | undefined>();
  const [state, action, pending] = useActionState(saveBannerAction, initial);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      setOpen(false);
      setEditing(undefined);
      router.refresh();
    }
  }, [state.success, toast, router]);

  return (
    <div>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> New banner
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {banners.map((banner) => (
          <article key={banner.id} className="card overflow-hidden">
            <div className="relative h-28 bg-leaf-mint">
              {banner.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
              )}
              <span className="absolute left-2 top-2">
                <Badge tone={banner.is_active ? "white" : "neutral"}>{banner.placement.replace("_", " ")}</Badge>
              </span>
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-[12.5px] font-semibold text-forest-950">{banner.title}</p>
              <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">{banner.subtitle}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge tone={banner.is_active ? "green" : "neutral"}>{banner.is_active ? "Live" : "Hidden"}</Badge>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setEditing(banner); setOpen(true); }}
                    className="rounded-lg border border-line px-2 py-1 text-[10.5px] font-semibold text-forest-800 hover:bg-leaf-mint"
                  >
                    Edit
                  </button>
                  <RowAction
                    onClick={async () => {
                      const result = await deleteBannerAction(banner.id);
                      if (result.error) toast(result.error, "error");
                      else {
                        toast(result.success ?? "Banner removed.");
                        router.refresh();
                      }
                    }}
                    label="Delete"
                    icon={<Trash2 className="h-3 w-3" />}
                    tone="danger"
                    confirm="Delete this banner?"
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit banner" : "New banner"} size="md">
        <form key={editing?.id ?? "new"} action={action} className="space-y-3.5">
          <Alert state={state} />
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Placement" htmlFor="banner-placement" required>
              <Select id="banner-placement" name="placement" defaultValue={editing?.placement ?? "hero"}>
                <option value="hero">Hero carousel</option>
                <option value="offer">Homepage offer</option>
                <option value="special_offer">Logged-in special offer</option>
                <option value="dashboard_promo">Customer dashboard promo</option>
              </Select>
            </Field>
            <Field label="Eyebrow" htmlFor="banner-eyebrow">
              <Input id="banner-eyebrow" name="eyebrow" defaultValue={editing?.eyebrow ?? ""} />
            </Field>
            <Field label="Title" htmlFor="banner-title" className="sm:col-span-2" error={state.fieldErrors?.title} required>
              <Input id="banner-title" name="title" defaultValue={editing?.title ?? ""} required />
            </Field>
            <Field label="Subtitle" htmlFor="banner-subtitle" className="sm:col-span-2">
              <Input id="banner-subtitle" name="subtitle" defaultValue={editing?.subtitle ?? ""} />
            </Field>
            <Field label="Image URL" htmlFor="banner-image" className="sm:col-span-2" error={state.fieldErrors?.image_url}>
              <Input id="banner-image" name="image_url" defaultValue={editing?.image_url ?? ""} placeholder="https://…" />
            </Field>
            <Field label="Button label" htmlFor="banner-cta">
              <Input id="banner-cta" name="cta_label" defaultValue={editing?.cta_label ?? ""} />
            </Field>
            <Field label="Button link" htmlFor="banner-url">
              <Input id="banner-url" name="cta_url" defaultValue={editing?.cta_url ?? ""} placeholder="/shop" />
            </Field>
            <Field label="Sort order" htmlFor="banner-order">
              <Input id="banner-order" name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? 1} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox name="is_active" defaultChecked={editing?.is_active ?? true} label="Active" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Submit pending={pending}>Save banner</Submit>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* -------------------------------- Settings -------------------------------- */

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, initial);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);

  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Store details</h2>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Field label="Store name" htmlFor="set-name" required>
            <Input id="set-name" name="store_name" defaultValue={settings.store_name} required />
          </Field>
          <Field label="Tagline" htmlFor="set-tagline">
            <Input id="set-tagline" name="store_tagline" defaultValue={settings.store_tagline} />
          </Field>
          <Field label="Support email" htmlFor="set-email" required>
            <Input id="set-email" name="store_email" defaultValue={settings.store_email} type="email" required />
          </Field>
          <Field label="Support phone" htmlFor="set-phone" required>
            <Input id="set-phone" name="store_phone" defaultValue={settings.store_phone} required />
          </Field>
          <Field label="Store address" htmlFor="set-address" className="sm:col-span-2">
            <Input id="set-address" name="store_address" defaultValue={settings.store_address} />
          </Field>
          <Field label="GSTIN" htmlFor="set-gst">
            <Input id="set-gst" name="gst_number" defaultValue={settings.gst_number} />
          </Field>
          <Field label="GST percent (inclusive)" htmlFor="set-gst-percent">
            <Input id="set-gst-percent" name="gst_percent" type="number" min={0} max={28} step="0.5" defaultValue={settings.gst_percent} />
          </Field>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Shipping & returns</h2>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Field label="Free shipping above (₹)" htmlFor="set-free">
            <Input id="set-free" name="free_shipping_threshold" type="number" min={0} defaultValue={settings.free_shipping_threshold} />
          </Field>
          <Field label="Standard delivery charge (₹)" htmlFor="set-delivery">
            <Input id="set-delivery" name="delivery_charge" type="number" min={0} defaultValue={settings.delivery_charge} />
          </Field>
          <Field label="Return window (days)" htmlFor="set-return">
            <Input id="set-return" name="return_window_days" type="number" min={0} defaultValue={settings.return_window_days} />
          </Field>
          <Field label="Damage claim window (hours)" htmlFor="set-claim">
            <Input id="set-claim" name="claim_window_hours" type="number" min={0} defaultValue={settings.claim_window_hours} />
          </Field>
          <Field label="Low stock threshold" htmlFor="set-low">
            <Input id="set-low" name="low_stock_threshold" type="number" min={0} defaultValue={settings.low_stock_threshold} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Checkbox name="cod_enabled" defaultChecked={settings.cod_enabled} label="Cash on delivery" />
          <Checkbox name="online_payment_enabled" defaultChecked={settings.online_payment_enabled} label="Online payments" />
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-forest-950">Loyalty programme</h2>
        <p className="mt-1 text-[11px] text-muted">
          Disabled by default. Both rates must be greater than zero for points to appear in the customer dashboard.
        </p>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Field label="Points earned per ₹100" htmlFor="set-earn">
            <Input id="set-earn" name="loyalty_earn_rate" type="number" min={0} max={100} defaultValue={settings.loyalty_earn_rate} />
          </Field>
          <Field label="Points needed for ₹100 off" htmlFor="set-redeem">
            <Input id="set-redeem" name="loyalty_redeem_rate" type="number" min={0} max={100} defaultValue={settings.loyalty_redeem_rate} />
          </Field>
        </div>
        <div className="mt-4">
          <Checkbox name="loyalty_enabled" defaultChecked={settings.loyalty_enabled} label="Enable loyalty points" />
        </div>
      </section>

      <div className="flex justify-end">
        <Submit pending={pending}>Save settings</Submit>
      </div>
    </form>
  );
}

export function ZoneManager({ zones }: { zones: DeliveryZone[] }) {
  const [state, action, pending] = useActionState(saveZoneAction, initial);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
    }
  }, [state.success, toast, router]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-semibold">Pincode</th>
              <th className="py-2 pr-3 font-semibold">Charge</th>
              <th className="py-2 pr-3 font-semibold">ETA</th>
              <th className="py-2 text-right font-semibold">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {zones.map((zone) => (
              <tr key={zone.pincode}>
                <td className="py-2.5 pr-3 font-mono font-semibold text-forest-950">{zone.pincode}</td>
                <td className="py-2.5 pr-3">{zone.charge === 0 ? "Free" : formatINR(zone.charge)}</td>
                <td className="py-2.5 pr-3">{zone.estimated_days} days</td>
                <td className="py-2.5 text-right">
                  <RowAction
                    onClick={async () => {
                      const result = await deleteZoneAction(zone.pincode);
                      if (result.error) toast(result.error, "error");
                      else {
                        toast(result.success ?? "Zone removed.");
                        router.refresh();
                      }
                    }}
                    label="Remove"
                    icon={<Trash2 className="h-3 w-3" />}
                    tone="danger"
                  />
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted">
                  Every pincode is delivered. Add a zone only to override the charge or delivery estimate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form action={action} className="rounded-2xl border border-line bg-white p-4">
        <h3 className="font-display text-[16px] font-semibold text-forest-950">Add / update zone</h3>
        <div className="mt-3 space-y-3">
          <Alert state={state} />
          <Field label="Pincode" htmlFor="zone-pin" error={state.fieldErrors?.pincode} required>
            <Input id="zone-pin" name="pincode" inputMode="numeric" placeholder="560038" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Charge (₹)" htmlFor="zone-charge" required>
              <Input id="zone-charge" name="charge" type="number" min={0} defaultValue={49} required />
            </Field>
            <Field label="Days" htmlFor="zone-days" required>
              <Input id="zone-days" name="estimated_days" type="number" min={0} defaultValue={3} required />
            </Field>
          </div>
          <p className="text-[10.5px] leading-relaxed text-muted">
            Every pincode is delivered. Zones only adjust the delivery charge and estimated days for specific pincodes.
          </p>
          <Submit pending={pending}>Save zone</Submit>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------- Utility bits ------------------------------ */

export function AdminRowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className={buttonClasses({ variant: "ghost", size: "sm", className: "h-7 px-2 text-[10.5px]" })}>
      {children}
    </a>
  );
}

export function ExportButton({ href, label = "Export CSV" }: { href: string; label?: string }) {
  return (
    <a href={href} className={buttonClasses({ variant: "secondary", size: "sm" })}>
      <CheckCircle2 className="h-3.5 w-3.5" /> {label}
    </a>
  );
}

export { RotateCcw, Star };
