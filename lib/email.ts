import { Resend } from "resend";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/utils";

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const from = process.env.EMAIL_FROM || "Leaf & Pot <orders@leafandpot.in>";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function shell(content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4faf5;font-family:Inter,Arial,sans-serif;color:#1b2b24">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 20px">
      <span style="display:inline-block;background:#1f4d3a;color:#fff;padding:10px 14px;border-radius:12px;font-family:Georgia,serif;font-size:20px;font-weight:700">Leaf &amp; Pot</span>
      <p style="margin:8px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#66786d">Green Home. Happy You.</p>
    </div>
    <div style="background:#fff;border:1px solid #e2ebe4;border-radius:18px;padding:24px">${content}</div>
    <p style="text-align:center;font-size:11px;color:#66786d;margin-top:18px">Questions? Reply to this email or write to hello@leafandpot.in.<br/>Leaf &amp; Pot · Bengaluru, India</p>
  </div></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  const client = resendClient();
  if (!client) {
    console.info(`[email] RESEND_API_KEY not set; skipped "${subject}" to ${to.replace(/(.{2}).*(@.*)/, "$1***$2")}`);
    return { ok: false, skipped: true };
  }
  try {
    const { error } = await client.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`[email] send failed: ${error.message}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email] send failed", error instanceof Error ? error.message : "unknown error");
    return { ok: false };
  }
}

export async function sendOrderConfirmation(order: Order) {
  const items = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eef4ef"><strong>${item.name}</strong><br/><span style="font-size:11px;color:#66786d">${item.size} · ${item.pot_type} · Qty ${item.qty}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eef4ef">${formatINR(item.price * item.qty)}</td></tr>`,
    )
    .join("");
  const html = shell(`
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 6px">Your plants are booked in.</h1>
    <p style="font-size:13px;color:#66786d;margin:0 0 16px">Order <strong style="color:#1b2b24">${order.order_number}</strong> · ${order.payment_method === "cod" ? "Cash on delivery" : "Paid online"}</p>
    <p style="font-size:13px">Hi ${order.address.name.split(" ")[0]}, thank you for bringing a little more green home. We're hand-checking your order now and will email you as soon as it's on its way.</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:12px">${items}</table>
    <table style="width:100%;font-size:12px;color:#66786d">
      <tr><td>Subtotal</td><td align="right">${formatINR(order.subtotal)}</td></tr>
      ${order.discount ? `<tr><td>Discount (${order.coupon_code ?? "coupon"})</td><td align="right">− ${formatINR(order.discount)}</td></tr>` : ""}
      <tr><td>Delivery</td><td align="right">${order.delivery_charge ? formatINR(order.delivery_charge) : "Free"}</td></tr>
      <tr><td style="padding-top:8px;font-size:14px;color:#1b2b24"><strong>Total</strong></td><td align="right" style="padding-top:8px;font-size:14px;color:#1b2b24"><strong>${formatINR(order.total)}</strong></td></tr>
    </table>
    <p style="font-size:11px;color:#66786d">Inclusive of ${formatINR(order.gst, true)} GST. Delivering to ${order.address.line1}, ${order.address.city} ${order.address.pincode}.</p>
    <a href="${siteUrl}/account/orders/${order.id}" style="display:inline-block;margin-top:14px;background:#1f4d3a;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-size:12px;font-weight:600">Track your order</a>
    <p style="font-size:11px;color:#66786d;margin-top:18px">Your plant care guide is on its way with the order. If anything looks unhappy on arrival, reply within ${7} days and we'll make it right.</p>
  `);
  return send(order.customer_email, `Order ${order.order_number} confirmed — Leaf & Pot`, html);
}

export async function sendOrderStatusEmail(order: Order, status: string) {
  const labels: Record<string, string> = {
    packed: "carefully packed",
    shipped: "on its way",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  const html = shell(`
    <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px">Order ${labels[status] ?? status}</h1>
    <p style="font-size:13px;color:#66786d">Order <strong style="color:#1b2b24">${order.order_number}</strong></p>
    <p style="font-size:13px">${
      status === "shipped"
        ? `Your plants left our greenhouse${order.courier ? ` with ${order.courier}` : ""}${order.tracking_number ? `. Tracking number: <strong>${order.tracking_number}</strong>` : ""}.`
        : status === "delivered"
          ? "Your order has been delivered. We hope everything arrived happy and healthy — your care guide is inside."
          : status === "cancelled"
            ? "Your order has been cancelled. If you paid online, the refund will reach you within 5–7 business days."
            : "Your plants have been hand-checked and packed. They'll be on their way shortly."
    }</p>
    <a href="${siteUrl}/account/orders/${order.id}" style="display:inline-block;margin-top:14px;background:#1f4d3a;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-size:12px;font-weight:600">View order</a>
  `);
  return send(order.customer_email, `Order ${order.order_number}: ${status} — Leaf & Pot`, html);
}

export async function sendReturnUpdateEmail(orderNumber: string, email: string, status: string, note?: string | null) {
  const html = shell(`
    <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px">Return update</h1>
    <p style="font-size:13px">Your return request for order <strong>${orderNumber}</strong> is now <strong style="text-transform:capitalize">${status}</strong>.</p>
    ${note ? `<p style="font-size:12px;color:#66786d;border-left:3px solid #c5e0ce;padding-left:12px">${note}</p>` : ""}
    <a href="${siteUrl}/account/orders" style="display:inline-block;margin-top:14px;background:#1f4d3a;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-size:12px;font-weight:600">View my orders</a>
  `);
  return send(email, `Return request ${status} — Leaf & Pot`, html);
}

export async function sendContactAcknowledgement(name: string, email: string, topic: string) {
  const html = shell(`
    <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px">We've got your message</h1>
    <p style="font-size:13px">Hi ${name}, thank you for reaching out about <strong>${topic}</strong>. Our team replies within one working day.</p>
    <p style="font-size:12px;color:#66786d">For urgent order help, include your order number in a reply to this email.</p>
  `);
  return send(email, "We received your message — Leaf & Pot", html);
}

export async function sendContactNotification(name: string, email: string, topic: string, message: string) {
  const html = shell(`
    <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px">New contact message</h1>
    <p style="font-size:13px"><strong>${name}</strong> (${email}) · ${topic}</p>
    <p style="font-size:13px;white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>
  `);
  return send("hello@leafandpot.in", `Contact: ${topic} — ${name}`, html);
}
