import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartAuthSync } from "@/components/cart/cart-auth-sync";
import { ToastProvider } from "@/components/atoms/toast";
import { CartDrawer } from "@/components/organisms/cart-drawer";

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lumen Eye Care",
    template: "%s · Lumen Eye Care",
  },
  description:
    "Premium eyewear, designed in Ghana. Lumen's inaugural frames collection.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-lumen-cream text-lumen-ink antialiased">
        <CartProvider>
          <CartAuthSync />
          <ToastProvider>
            {children}
            <CartDrawer />
          </ToastProvider>
        </CartProvider>
        {/* Core Web Vitals + page views only — no GA4 in v1 (Handoff §2). */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
