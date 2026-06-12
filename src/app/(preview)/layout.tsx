import type { Metadata } from "next";
import "@/styles/preview.css";
import { PreviewNav } from "@/components/preview/preview-nav";
import { PreviewFooter } from "@/components/preview/preview-footer";

/**
 * Isolated layout for the immersive homepage prototype (/preview/home).
 *
 * Deliberately does NOT use SiteHeader/SiteFooter — this is a self-contained
 * "Cinematic Dark" comparison artifact, not part of the live storefront chrome.
 * Noindexed so the prototype never reaches search; preview.css is scoped here so
 * none of it ships in the production bundle.
 */
export const metadata: Metadata = {
  title: "Lumen — Immersive preview",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="preview-root">
      <PreviewNav />
      <div className="pv-shell">{children}</div>
      <PreviewFooter />
    </div>
  );
}
