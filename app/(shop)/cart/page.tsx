import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review your Leaf & Pot bag, apply a coupon and check delivery.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartView />;
}
