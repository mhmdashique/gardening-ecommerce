import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .max(40),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, loggedIn: false }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  if (!isSupabaseConfigured()) {
    // Demo mode: the browser cart is the cart. Nothing to persist.
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = await createServerSupabase();
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .upsert({ user_id: user.id }, { onConflict: "user_id" })
    .select("id")
    .maybeSingle();
  if (cartError || !cart) return NextResponse.json({ ok: false }, { status: 400 });

  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  if (parsed.data.lines.length) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, price")
      .in("id", parsed.data.lines.map((line) => line.variantId));
    const valid = new Set((variants ?? []).map((variant) => variant.id));
    const rows = parsed.data.lines
      .filter((line) => valid.has(line.variantId))
      .map((line) => ({ cart_id: cart.id, variant_id: line.variantId, qty: line.qty }));
    if (rows.length) await supabase.from("cart_items").insert(rows);
  }

  return NextResponse.json({ ok: true });
}
