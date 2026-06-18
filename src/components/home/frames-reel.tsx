"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useCallback } from "react";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import type { ShopFrame } from "@/server/frames";

/**
 * Frames reel — the production-data moment. Real catalogue frames reveal in a
 * staggered grid as they scroll in; FrameSVG renders the silhouette until photo
 * uploads exist. Degrades to a curated FrameSVG showcase when no data loads.
 */

const FALLBACK: { shape: string; tint: string }[] = [
  { shape: "aviator", tint: "#0A1F35" },
  { shape: "round", tint: "#d97757" },
  { shape: "cateye", tint: "#3d6b5c" },
  { shape: "square", tint: "#0A1F35" },
  { shape: "hex", tint: "#d97757" },
  { shape: "oval", tint: "#3d6b5c" },
];

export function FramesReel({ frames }: { frames: ShopFrame[] }) {
  const items = frames.slice(0, 6);
  const usingFallback = items.length === 0;

  return (
    <section
      id="frames"
      className="relative px-6 py-24 sm:py-32"
      style={{ background: "var(--lm-deep)", scrollMarginTop: "var(--nav-h)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="flex flex-wrap items-end justify-between gap-6"
          data-animate
        >
          <div>
            <p className="lm-label">The collection</p>
            <h2
              className="lm-display mt-4"
              style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}
            >
              Frames worth looking through.
            </h2>
          </div>
          <Link href="/shop" className="lm-ghost">
            View all frames
            <Icon name="arrow" size={16} />
          </Link>
        </div>

        <div
          data-stagger
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {usingFallback
            ? FALLBACK.map((f, i) => (
                <FallbackCard key={i} shape={f.shape} tint={f.tint} />
              ))
            : items.map((frame) => (
                <FrameCardDark key={frame.id} frame={frame} />
              ))}
        </div>
      </div>
    </section>
  );
}

function FrameCardDark({ frame }: { frame: ShopFrame }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const photo = frame.photo_urls[0];

  const onMove = useCallback((e: React.MouseEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 0.08s ease-out, box-shadow 0.08s ease-out";
    el.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    el.style.boxShadow = `${-x * 12}px ${-y * 8 + 20}px 48px var(--lm-shadow), 0 0 32px color-mix(in srgb, var(--lm-warm) 10%, transparent)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.45s ease-out, box-shadow 0.45s ease-out";
    el.style.transform = "";
    el.style.boxShadow = "";
  }, []);

  return (
    <Link
      ref={ref}
      href={`/shop/${frame.slug}`}
      className="lm-card group block overflow-hidden p-6"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center">
        {photo ? (
          <Image
            src={photo}
            alt={frame.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-3/4 transition-transform duration-500 group-hover:scale-105">
            <FrameSVG shape={frame.shape} color="var(--lm-text)" />
          </div>
        )}
        {frame.badge && (
          <span
            className="absolute left-0 top-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
            style={{ background: "var(--lm-warm)", color: "#1a0f0a" }}
          >
            {frame.badge}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <h3
            className="text-lg font-medium"
            style={{ color: "var(--lm-text)" }}
          >
            {frame.name}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--lm-faint)" }}>
            {[frame.material, frame.category?.name].filter(Boolean).join(" · ") ||
              "Eyewear"}
          </p>
        </div>
        <p
          className="text-base font-semibold"
          style={{ color: "var(--lm-warm)" }}
        >
          {formatGhs(frame.price_ghs)}
        </p>
      </div>

      {frame.colors.length > 0 && (
        <div className="mt-4 flex gap-1.5">
          {frame.colors.slice(0, 5).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-4 w-4 rounded-full"
              style={{ background: c.hex, outline: "1px solid var(--lm-hair)" }}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

function FallbackCard({ shape, tint }: { shape: string; tint: string }) {
  return (
    <div className="lm-card p-6">
      <div className="flex aspect-[4/3] items-center justify-center">
        <div className="w-3/4">
          <FrameSVG shape={shape} color={tint} />
        </div>
      </div>
      <p className="mt-5 text-sm" style={{ color: "var(--lm-faint)" }}>
        Catalogue loads from the live store.
      </p>
    </div>
  );
}
