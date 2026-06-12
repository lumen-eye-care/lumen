"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal controller for the /preview/home prototype.
 *
 * Mount once near the root of the preview tree. It finds every element carrying
 * a `data-animate` or `data-stagger` attribute and toggles `data-revealed="true"`
 * when it scrolls into view — the actual motion is pure CSS in preview.css,
 * keyed off that attribute. IntersectionObserver is universally supported and
 * costs nothing on the production bundle (this route only).
 *
 * Honors prefers-reduced-motion by revealing everything immediately (the CSS
 * static branch already neutralises the transitions, this just avoids leaving
 * elements at opacity:0 if the observer never fires).
 */
export function useReveal(): void {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animate], [data-stagger]"),
    );
    if (targets.length === 0) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target); // reveal once, then release
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
