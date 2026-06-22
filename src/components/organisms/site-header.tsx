"use client";

/**
 * Global site header — theme-aware (light/dark via --lm-* vars) and
 * context-aware: transparent over the home hero, frosted glass once scrolled
 * or on any inner page. Touch targets ≥44px; focus outlines kept.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/atoms/logo-lockup";
import { Icon } from "@/components/atoms/icon";
import { useCart } from "@/components/cart/cart-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/lib/supabase-browser";
import { getInitials } from "@/lib/initials";

const NAV_LINKS = [
  { href: "/shop", label: "Shop glasses" },
  { href: "/lens-guide", label: "Lens guide" },
  { href: "/book", label: "Eye tests" },
  { href: "/clinics", label: "Clinics" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountInitials, setAccountInitials] = useState<string | null>(null);
  const pathname = usePathname();
  const { count, hydrated, open } = useCart();

  const isHome = pathname === "/";
  // Transparent only when sitting over the home hero and not yet scrolled.
  const transparent = isHome && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reflect signed-in state in the account icon (initials avatar vs guest icon).
  // Mirrors CartAuthSync: env-guarded, onAuthStateChange fires INITIAL_SESSION on
  // subscribe so the current session resolves on mount. Read-only — RLS unchanged.
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return;
    }
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAccountInitials(
        user
          ? getInitials(
              (user.user_metadata?.name as string | undefined) ?? null,
              user.email ?? "",
            )
          : null,
      );
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change (stable string comparison → no loop).
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMenuOpen(false);
    }
  }, [pathname]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 w-full transition-[background-color,box-shadow,backdrop-filter] duration-300"
      style={{
        height: "var(--nav-h)",
        backgroundColor: transparent ? "transparent" : "var(--lm-base-glass)",
        backdropFilter: transparent ? "none" : "blur(12px)",
        WebkitBackdropFilter: transparent ? "none" : "blur(12px)",
        borderBottom: `1px solid ${transparent ? "transparent" : "var(--lm-hair)"}`,
        boxShadow: scrolled && !transparent ? "0 2px 18px var(--lm-shadow)" : "none",
      }}
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--lm-warm)]"
          style={{ color: "var(--lm-text)" }}
          aria-label="Lumen Eye Care — home"
        >
          <LogoLockup size={22} gap={3} color="currentColor" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                style={{
                  color: active ? "var(--lm-warm)" : "var(--lm-muted)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Always points at /account: signed-in users land on the dashboard;
              signed-out users hit requireUser() in the account layout and are
              bounced to /sign-in. When signed in, show the initials avatar so the
              header reflects logged-in (vs guest) state. */}
          <Link
            href="/account"
            aria-label={accountInitials ? "Your account" : "Account"}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
            style={{ color: "var(--lm-muted)" }}
          >
            {accountInitials ? (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--lm-blue) 16%, transparent)",
                  color: "var(--lm-blue)",
                }}
              >
                {accountInitials}
              </span>
            ) : (
              <Icon name="user" size={18} />
            )}
          </Link>

          <button
            type="button"
            onClick={open}
            aria-label={
              hydrated && count > 0
                ? `Bag, ${count} item${count === 1 ? "" : "s"}`
                : "Bag"
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
            style={{ color: "var(--lm-muted)" }}
          >
            <Icon name="cart" size={18} />
            {hydrated && count > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
                style={{ background: "var(--lm-warm)", color: "#1a0f0a" }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {/* Wrapper carries the responsive visibility: .lm-pill is unlayered
              CSS and would override Tailwind's layered `.hidden`, so the
              hide/show toggle must live on a plain element, not the pill. */}
          <div className="ml-2 hidden md:block">
            <Link href="/book" className="lm-pill">
              Book eye test
              <Icon name="arrowUp" size={12} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)] md:hidden"
            style={{ color: "var(--lm-text)" }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <Icon name="x" size={20} />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="px-6 pb-4 pt-3 md:hidden"
          style={{
            background: "var(--lm-base)",
            borderTop: "1px solid var(--lm-hair)",
          }}
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="block rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                    style={{
                      color: active ? "var(--lm-warm)" : "var(--lm-text)",
                      fontWeight: active ? 600 : 400,
                      background: active ? "var(--lm-tint)" : "transparent",
                    }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-3">
              <Link
                href="/book"
                className="lm-pill w-full justify-center"
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
