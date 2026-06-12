"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/atoms/logo-mark";
import { useReveal } from "./use-reveal";

/**
 * Slim hairline nav for the immersive prototype. Transparent over the hero,
 * gaining a blurred dark backing once scrolled. Mounts the scroll-reveal
 * controller for the whole preview tree (it renders once in the layout).
 */
export function PreviewNav() {
  useReveal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="pv-focus-in fixed inset-x-0 top-0 z-30 transition-colors duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(5,15,27,0.72)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--pv-hair)"
          : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/preview/home"
          className="flex items-center gap-2.5"
          aria-label="Lumen home"
        >
          <LogoMark size={26} color="#f2f2f0" />
          <span
            className="pv-display text-xl"
            style={{ color: "var(--pv-text)" }}
          >
            Lumen
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          <a href="#frames" className="pv-link">
            Frames
          </a>
          <a href="#visit" className="pv-link">
            Visit us
          </a>
        </div>

        <Link href="/book" className="pv-pill">
          Book eye test
        </Link>
      </nav>
    </header>
  );
}
