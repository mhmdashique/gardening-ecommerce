import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAdmin } from "@/lib/auth";
import { getOrderForUser, getSettings } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/orders");
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderForUser(id), getSettings()]);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // 4 x 6 inch label.
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([288, 432]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.1, 0.09);
  const muted = rgb(0.4, 0.45, 0.42);
  const left = 16;
  const right = 272;

  page.drawText("LEAF & POT", { x: left, y: 404, size: 14, font: bold, color: ink });
  page.drawText("Green Home. Happy You.", { x: left, y: 391, size: 7, font, color: muted });
  page.drawText(`ORDER ${order.order_number}`, { x: right - 108, y: 404, size: 9, font: bold, color: ink });

  page.drawLine({ start: { x: left, y: 382 }, end: { x: right, y: 382 }, thickness: 1, color: rgb(0.75, 0.8, 0.76) });

  page.drawText("DELIVER TO", { x: left, y: 368, size: 7, font: bold, color: muted });
  page.drawText(order.address.name, { x: left, y: 355, size: 11, font: bold, color: ink });
  let y = 341;
  for (const line of [
    order.address.line1,
    order.address.line2 ?? "",
    `${order.address.city}, ${order.address.state}`,
    `PIN ${order.address.pincode}`,
  ].filter(Boolean)) {
    page.drawText(line, { x: left, y, size: 9, font, color: ink, maxWidth: right - left });
    y -= 12;
  }
  page.drawText(`Phone: ${order.address.phone}`, { x: left, y: y - 2, size: 9, font: bold, color: ink });

  y -= 24;
  page.drawRectangle({ x: left, y: y - 10, width: right - left, height: 34, color: rgb(0.94, 0.96, 0.94) });
  page.drawText("PAYMENT", { x: left + 6, y: y + 12, size: 6.5, font: bold, color: muted });
  page.drawText(order.payment_method === "cod" ? "CASH ON DELIVERY" : "PREPAID — DO NOT COLLECT", {
    x: left + 6,
    y: y + 2,
    size: 10,
    font: bold,
    color: ink,
  });
  page.drawText(`COLLECT: Rs. ${order.payment_method === "cod" ? order.total : 0}`, {
    x: left + 6,
    y: y - 6,
    size: 8,
    font,
    color: ink,
  });
  page.drawText(`${order.items.reduce((sum, item) => sum + item.qty, 0)} item(s)`, {
    x: right - 52,
    y: y + 2,
    size: 8,
    font: bold,
    color: ink,
  });

  y -= 34;
  page.drawText("CONTENTS", { x: left, y, size: 6.5, font: bold, color: muted });
  y -= 12;
  for (const item of order.items.slice(0, 5)) {
    page.drawText(`${item.qty} × ${item.name} (${item.size})`, {
      x: left,
      y,
      size: 8,
      font,
      color: ink,
      maxWidth: right - left,
    });
    y -= 11;
  }
  if (order.items.length > 5) {
    page.drawText(`+ ${order.items.length - 5} more line(s)`, { x: left, y, size: 8, font, color: muted });
    y -= 11;
  }

  y -= 6;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.7, color: rgb(0.75, 0.8, 0.76) });
  y -= 16;
  page.drawText("HANDLE WITH CARE — LIVING PLANT", { x: left, y, size: 9, font: bold, color: ink });
  y -= 12;
  page.drawText("Keep upright. Avoid direct sun and heat. Open within 24 hours.", {
    x: left,
    y,
    size: 7,
    font,
    color: muted,
    maxWidth: right - left,
  });

  // Decorative barcode.
  let x = left;
  let seed = order.order_number.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  while (x < right - 10) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const width = 1 + (seed % 3);
    const height = 28 + (seed % 14);
    page.drawRectangle({ x, y: 34, width, height, color: ink });
    x += width + 1 + (seed % 2);
  }
  page.drawText(order.order_number, { x: left, y: 20, size: 8, font, color: muted });
  page.drawText(`${settings.store_phone}  ·  ${settings.store_email}`, { x: left, y: 8, size: 6.5, font, color: muted });

  const bytes = await pdf.save();
  return new NextResponse(new Blob([Buffer.from(bytes)], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="label-${order.order_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
