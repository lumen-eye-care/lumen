"use client";

/**
 * Global site header — ported + typed from docs/design/shared.jsx SubNav.
 * Rendered inside (marketing)/layout.tsx; scroll-shadow via useEffect.
 * Touch targets ≥44px; focus outlines kept (never suppress).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/atoms/logo-mark";
import { Icon } from "@/components/atoms/icon";
import { useCart } from "@/components/cart/cart-provider";

const NAV_LINKS = [
  { href: "/shop", label: "Shop glasses" },
  { href: "/clinics", label: "Eye tests" },
  { href: "/book", label: "Book appointment" },
  // TODO(US-P2-02): restore { href: "/lens-guide", label: "Lens guide" }
  // TODO(US-P2-03): restore { href: "/journal", label: "Journal" }
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count, hydrated, open } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu whenever the route changes.
  // Comparison is stable (string equality), so the effect only runs on actual
  // navigation — no synchronous setState loop.
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMenuOpen(false);
    }
  }, [pathname]);

  return (
    <header
      className={[
        "sticky top-0 z-40 w-full transition-shadow duration-200",
        "bg-lumen-cream/95 backdrop-blur-sm",
        scrolled ? "shadow-[0_2px_16px_rgba(10,31,53,0.08)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lumen-ink transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lumen-blue"
          aria-label="Lumen Eye Care — home"
        >
          <LogoMark size={28} />
          <span className="font-display text-xl font-normal tracking-tight">
            Lumen
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue",
                pathname.startsWith(href)
                  ? "font-medium text-lumen-blue"
                  : "text-lumen-ink/70 hover:text-lumen-ink",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            aria-label="Account"
            className="flex h-11 w-11 items-center justify-center rounded-md text-lumen-ink/70 transition-colors hover:bg-lumen-ink/5 hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            <Icon name="user" size={18} />
          </Link>

          <button
            type="button"
            onClick={open}
            aria-label={
              hydrated && count > 0 ? `Bag, ${count} item${count === 1 ? "" : "s"}` : "Bag"
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-md text-lumen-ink/70 transition-colors hover:bg-lumen-ink/5 hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            <Icon name="cart" size={18} />
            {hydrated && count > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lumen-warm px-1 text-[10px] font-semibold leading-none text-lumen-cream">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          <Link
            href="/clinics"
            className="ml-2 hidden items-center gap-1.5 rounded-md bg-lumen-blue px-4 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue sm:flex"
          >
            Book eye test
            <Icon name="arrowUp" size={12} />
          </Link>

          {/* Mobile hamburger */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md text-lumen-ink/70 transition-colors hover:bg-lumen-ink/5 hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <Icon name="x" size={20} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="border-t border-lumen-ink/8 bg-lumen-cream px-6 pb-4 pt-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "block rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue",
                    pathname.startsWith(href)
                      ? "bg-lumen-blue/8 font-medium text-lumen-blue"
                      : "text-lumen-ink hover:bg-lumen-ink/5",
                  ].join(" ")}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="mt-3">
              <Link
                href="/clinics"
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-lumen-blue px-4 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                Book eye test
                <Icon name="arrowUp" size={12} />
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
