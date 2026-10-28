import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Leaf & Pot | Beautiful Plants for a Healthier, Happier You",
    template: "%s | Leaf & Pot",
  },
  description:
    "Shop indoor plants, outdoor plants, succulents, pots and garden essentials. Free shipping on eligible orders, secure payment and free plant care support.",
  keywords: [
    "buy plants online",
    "indoor plants India",
    "succulents online",
    "plant pots",
    "garden accessories",
    "Leaf & Pot",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Leaf & Pot",
    title: "Leaf & Pot | Green Home. Happy You.",
    description: "Beautiful plants for a healthier, happier you. Free shipping on eligible orders.",
    url: siteUrl,
    images: [{ url: "/images/landing.png", width: 1200, height: 630, alt: "Leaf & Pot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaf & Pot | Green Home. Happy You.",
    description: "Beautiful plants for a healthier, happier you.",
    images: ["/images/landing.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f4d3a",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-leaf-cream font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-lg bg-forest-800 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
