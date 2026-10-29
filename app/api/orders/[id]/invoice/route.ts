import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth";
import { getOrderForUser, getSettings } from "@/lib/catalog";
import { paymentStatusLabel } from "@/lib/utils";

export const runtime = "nodejs";

function money(value: number) {
  return `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.is_blocked) return NextResponse.json({ error: "This account is unavailable." }, { status: 403 });

  // ?preview=1 renders the PDF inline (new tab) instead of downloading it.
  const preview = new URL(request.url).searchParams.get("preview") === "1";

  const { id } = await params;
  const [order, settings] = await Promise.all([
    getOrderForUser(id, user.role === "admin" ? undefined : user.id),
    getSettings(),
  ]);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.15, 0.12);
  const muted = rgb(0.42, 0.48, 0.44);
  const green = rgb(0.12, 0.3, 0.22);
  const line = rgb(0.88, 0.91, 0.88);

  const left = 48;
  const right = 547;
  let y = 800;

  page.drawText(settings.store_name, { x: left, y, size: 22, font: bold, color: green });
  page.drawText(settings.store_tagline, { x: left, y: y - 18, size: 9, font, color: muted });
  page.drawText("TAX INVOICE", { x: right - 95, y, size: 13, font: bold, color: ink });
  page.drawText(`Invoice: ${order.invoice_number ?? `INV-${order.order_number}`}`, {
    x: right - 190,
    y: y - 18,
    size: 8.5,
    font,
    color: muted,
  });
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`, {
    x: right - 150,
    y: y - 31,
    size: 8.5,
    font,
    color: muted,
  });

  y -= 58;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.8, color: line });

  y -= 22;
  page.drawText("SOLD BY", { x: left, y, size: 7.5, font: bold, color: muted });
  page.drawText(settings.store_name, { x: left, y: y - 13, size: 9.5, font: bold, color: ink });
  page.drawText(settings.store_address, { x: left, y: y - 26, size: 8.5, font, color: muted, maxWidth: 220 });
  page.drawText(`GSTIN: ${settings.gst_number}`, { x: left, y: y - 39, size: 8.5, font, color: muted });
  page.drawText(settings.store_email, { x: left, y: y - 52, size: 8.5, font, color: muted });

  page.drawText("DELIVER TO", { x: 320, y, size: 7.5, font: bold, color: muted });
  page.drawText(order.address.name, { x: 320, y: y - 13, size: 9.5, font: bold, color: ink });
  const addressLines = [
    order.address.line1,
    order.address.line2 ?? "",
    `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    `Phone: ${order.address.phone}`,
  ].filter(Boolean);
  addressLines.forEach((entry, index) => {
    page.drawText(entry, { x: 320, y: y - 26 - index * 12, size: 8.5, font, color: muted, maxWidth: 220 });
  });

  y -= 88;
  page.drawText(`Order: ${order.order_number}`, { x: left, y, size: 9, font: bold, color: ink });
  page.drawText(`Payment: ${order.payment_method === "cod" ? "Cash on delivery" : "Online"} (${paymentStatusLabel(order.payment_status)})`, {
    x: 320,
    y,
    size: 9,
    font,
    color: muted,
  });

  y -= 20;
  page.drawRectangle({ x: left, y: y - 4, width: right - left, height: 20, color: rgb(0.95, 0.97, 0.95) });
  page.drawText("ITEM", { x: left + 6, y, size: 7.5, font: bold, color: muted });
  page.drawText("QTY", { x: 344, y, size: 7.5, font: bold, color: muted });
  page.drawText("RATE", { x: 398, y, size: 7.5, font: bold, color: muted });
  page.drawText("AMOUNT", { x: 480, y, size: 7.5, font: bold, color: muted });

  y -= 20;
  for (const item of order.items) {
    const name = `${item.name} (${item.size})`;
    page.drawText(name.slice(0, 52), { x: left + 6, y, size: 9, font, color: ink });
    page.drawText(String(item.qty), { x: 346, y, size: 9, font, color: ink });
    page.drawText(money(item.price), { x: 392, y, size: 9, font, color: ink });
    page.drawText(money(item.price * item.qty), { x: 472, y, size: 9, font, color: ink });
    y -= 14;
    page.drawLine({ start: { x: left, y: y + 5 }, end: { x: right, y: y + 5 }, thickness: 0.4, color: line });
    y -= 6;
  }

  y -= 10;
  const totalRows: [string, string][] = [
    ["Subtotal", money(order.subtotal)],
    ...(order.discount > 0 ? ([["Discount", `- ${money(order.discount)}`]] as [string, string][]) : []),
    ...((order.loyalty_discount ?? 0) > 0
      ? ([["Leaf points", `- ${money(order.loyalty_discount ?? 0)}`]] as [string, string][])
      : []),
    ["Delivery", order.delivery_charge === 0 ? "Free" : money(order.delivery_charge)],
    ["Total", money(order.total)],
  ];
  totalRows.forEach(([label, value], index) => {
    const isTotal = index === totalRows.length - 1;
    page.drawText(label, { x: 390, y, size: isTotal ? 11 : 9, font: isTotal ? bold : font, color: isTotal ? ink : muted });
    page.drawText(value, { x: 480, y, size: isTotal ? 11 : 9, font: isTotal ? bold : font, color: isTotal ? ink : ink });
    y -= isTotal ? 18 : 14;
  });

  y -= 6;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.6, color: line });
  y -= 14;
  page.drawText(
    `GST included in total: ${money(order.gst)} (${settings.gst_percent}% inclusive). Prices include GST.`,
    { x: left, y, size: 8, font, color: muted },
  );
  y -= 22;
  page.drawText("Thank you for growing with Leaf & Pot.", { x: left, y, size: 9, font: bold, color: green });
  y -= 13;
  page.drawText(
    `Returns accepted within ${settings.return_window_days} days of delivery. Damage claims within ${settings.claim_window_hours} hours.`,
    { x: left, y, size: 7.5, font, color: muted },
  );
  y -= 11;
  page.drawText("This is a computer-generated invoice and does not require a signature.", {
    x: left,
    y,
    size: 7.5,
    font,
    color: muted,
  });

  const bytes = await pdf.save();
  return new NextResponse(new Blob([Buffer.from(bytes)], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="invoice-${order.order_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
