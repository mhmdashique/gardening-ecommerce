import { requireAdmin } from "@/lib/auth";
import { getAllOrders } from "@/lib/catalog";

export const runtime = "nodejs";

function escape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  await requireAdmin("/admin/orders");
  const orders = await getAllOrders();

  const header = [
    "Order number",
    "Placed at",
    "Customer",
    "Email",
    "Phone",
    "Status",
    "Payment method",
    "Payment status",
    "Items",
    "Subtotal",
    "Discount",
    "Points discount",
    "Points used",
    "Delivery",
    "GST (included)",
    "Total",
    "Coupon",
    "City",
    "Pincode",
    "Tracking",
    "Courier",
  ];

  const rows = orders.map((order) =>
    [
      order.order_number,
      order.created_at,
      order.customer_name,
      order.customer_email,
      order.address.phone,
      order.status,
      order.payment_method,
      order.payment_status,
      order.items.reduce((sum, item) => sum + item.qty, 0),
      order.subtotal,
      order.discount,
      order.loyalty_discount ?? 0,
      order.loyalty_points_used,
      order.delivery_charge,
      order.gst,
      order.total,
      order.coupon_code ?? "",
      order.address.city,
      order.address.pincode,
      order.tracking_number ?? "",
      order.courier ?? "",
    ]
      .map(escape)
      .join(","),
  );

  const csv = [header.map(escape).join(","), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leaf-and-pot-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
