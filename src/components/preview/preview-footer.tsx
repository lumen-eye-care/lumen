import Link from "next/link";
import { LogoMark } from "@/components/atoms/logo-mark";

/**
 * Compact dark footer for the prototype. Intentionally minimal — the real
 * SiteFooter (data-driven clinics, newsletter, legal) stays on production.
 */
export function PreviewFooter() {
  return (
    <footer
      className="relative z-10 mt-24 border-t"
      style={{
        borderColor: "var(--pv-hair)",
        background: "var(--pv-deepest)",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={24} color="#f2f2f0" />
          <span className="pv-display text-lg" style={{ color: "var(--pv-text)" }}>
            Lumen Eye Care
          </span>
        </div>
        <p className="max-w-xs text-sm" style={{ color: "var(--pv-faint)" }}>
          Premium eyewear, designed in Ghana. This is an immersive preview —{" "}
          <Link href="/" className="pv-link underline">
            see the current site
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
