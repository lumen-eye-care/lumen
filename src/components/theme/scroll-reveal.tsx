"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Global scroll-reveal controller. Mount once in the root layout. Finds every
 * element carrying `data-animate` / `data-stagger` and toggles
 * `data-revealed="true"` as it enters view — the motion is pure CSS in
 * globals.css, keyed off that attribute.
 *
 * Robustness is the priority: a `data-animate` element sits at opacity:0 until
 * revealed, so a failure to reveal means invisible content. Three layers
 * guarantee that never happens:
 *   1. reduced-motion / no IntersectionObserver → reveal everything at once.
 *   2. A layout-based pass (getBoundingClientRect, no compositing needed)
 *      reveals anything already in/above the viewport on mount and on scroll —
 *      so above-the-fold content shows even if the observer is slow or throttled.
 *   3. IntersectionObserver drives the on-scroll reveal for the rest.
 *
 * Re-runs on route change so the next page's sections get wired up.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = (el: Element) => el.setAttribute("data-revealed", "true");
    const remaining = () =>
      Array.from(
        document.querySelectorAll(
          "[data-animate]:not([data-revealed]), [data-stagger]:not([data-revealed])",
        ),
      );

    // Layer 2: reveal anything whose top has crossed into (or above) the fold.
    // Includes elements scrolled past (r.top negative) so an anchor jump never
    // leaves content above the viewport stuck at opacity:0.
    const revealInView = () => {
      const h = window.innerHeight || document.documentElement.clientHeight;
      for (const el of remaining()) {
        if (el.getBoundingClientRect().top < h * 0.92) reveal(el);
      }
    };

    // Effects run after the DOM commit, so targets already exist — set up
    // synchronously rather than gating on requestAnimationFrame (which is
    // throttled in background/non-compositing contexts and would leave content
    // stuck at opacity:0 if it never fires).
    let observer: IntersectionObserver | undefined;
    let onScroll: (() => void) | undefined;

    const targets = remaining();
    if (targets.length > 0) {
      // Layer 1.
      if (reduce || !("IntersectionObserver" in window)) {
        targets.forEach(reveal);
      } else {
        // Layer 2 (initial) — above-the-fold content is never stuck.
        revealInView();

        // Layer 3 — on-scroll reveal for below-the-fold sections.
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                reveal(entry.target);
                observer!.unobserve(entry.target);
              }
            }
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
        );
        remaining().forEach((el) => observer!.observe(el));

        // Backstop: scrolling always reveals via the layout pass, even if the
        // observer is throttled (background tab, some mobile browsers).
        onScroll = () => revealInView();
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    }

    return () => {
      observer?.disconnect();
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
