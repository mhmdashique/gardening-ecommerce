import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const INR2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(value: number, decimals = false) {
  return decimals ? INR2.format(Number(value) || 0) : INR.format(Number(value) || 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", opts ?? { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function truncate(value: string, length = 80) {
  return value.length > length ? `${value.slice(0, length).trim()}…` : value;
}

export function absoluteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function safeNextPath(next: string | null | undefined, fallback = "/account") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function statusTone(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
    case "approved":
    case "paid":
    case "captured":
      return "success" as const;
    case "shipped":
      return "blue" as const;
    case "packed":
      return "amber" as const;
    case "processing":
    case "requested":
      return "violet" as const;
    case "cancelled":
    case "rejected":
    case "failed":
      return "danger" as const;
    case "refunded":
    case "returned":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

/** Customer-facing payment label: only captured money is shown as "Paid". */
export function paymentStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "captured":
      return "Paid";
    case "refunded":
      return "Refunded";
    default:
      return "Unpaid";
  }
}
