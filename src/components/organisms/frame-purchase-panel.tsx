"use client";

/**
 * Interactive PDP island (US-P0-02). The server page passes a serializable
 * ShopFrame; this component owns the colour selection + add-to-bag behaviour.
 *
 * Frame-only for v1 — lens type / add-ons / prescription are a non-interactive
 * "coming soon" notice here, built in US-P2-02 (Lens Builder).
 */

import { useState } from "react";
import Image from "next/image";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import { frameToCartItem, type CartItem } from "@/lib/cart";
import type { ShopFrame } from "@/server/frames";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/atoms/toast";

const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Best seller",
  NEW: "New",
  LIMITED: "Limited edition",
};

export function FramePurchasePanel({ frame }: { frame: ShopFrame }) {
  const { add, open } = useCart();
  const { toast } = useToast();
  const [colorIndex, setColorIndex] = useState(0);

  const color = frame.colors[colorIndex] ?? null;
  const primaryPhoto = frame.photo_urls[0] ?? null;
  const outOfStock = frame.stock <= 0;
  const meta = [frame.material, frame.category?.name].filter(Boolean).join(" · ");

  function handleAddToBag() {
    const item: CartItem | null = frameToCartItem(frame, colorIndex);
    if (!item || outOfStock) return;
    add(item);
    toast(`${frame.name}${color ? ` · ${color.name}` : ""} added to your bag.`);
    open();
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Gallery */}
      <div className="flex flex-col gap-4">
        <div
          className="relative flex items-center justify-center rounded-2xl px-10 py-12"
          style={{ background: "var(--lm-deep)" }}
        >
          {frame.badge && (
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: "color-mix(in srgb, var(--lm-blue) 12%, transparent)",
                color: "var(--lm-blue)",
              }}
            >
              {BADGE_LABEL[frame.badge] ?? frame.badge}
            </span>
          )}
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={`${frame.name} frames`}
              width={480}
              height={320}
              className="h-auto w-full max-w-sm object-contain"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
          ) : (
            <FrameSVG
              shape={frame.shape}
              color={color?.hex ?? "var(--lm-text)"}
              className="w-full max-w-sm"
            />
          )}
        </div>

        {/* Colour thumbnails */}
        {frame.colors.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {frame.colors.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColorIndex(i)}
                aria-label={`View ${c.name}`}
                aria-pressed={i === colorIndex}
                className="flex h-16 w-16 items-center justify-center rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                style={{
                  background: "var(--lm-deep)",
                  boxShadow:
                    i === colorIndex
                      ? "0 0 0 2px var(--lm-warm)"
                      : "0 0 0 1px var(--lm-hair)",
                }}
              >
                <FrameSVG shape={frame.shape} color={c.hex} className="w-[78%]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info + buy */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="lm-display text-4xl" style={{ color: "var(--lm-text)" }}>
            {frame.name}
          </h1>
          {meta && (
            <p className="mt-1 text-sm" style={{ color: "var(--lm-faint)" }}>
              {meta}
            </p>
          )}
        </div>

        <div>
          <p className="text-3xl font-medium" style={{ color: "var(--lm-warm)" }}>
            {formatGhs(frame.price_ghs)}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--lm-faint)" }}>
            Frame only · Lenses added at checkout
          </p>
        </div>

        {/* Colour selector */}
        {frame.colors.length > 0 && (
          <div>
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--lm-faint)" }}
            >
              Colour
              {color ? (
                <span style={{ color: "var(--lm-muted)" }}> · {color.name}</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {frame.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setColorIndex(i)}
                  aria-label={c.name}
                  aria-pressed={i === colorIndex}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow:
                      i === colorIndex
                        ? "0 0 0 2px var(--lm-warm), 0 0 0 4px var(--lm-base)"
                        : "0 0 0 1px var(--lm-hair)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-2 text-sm">
          {frame.stock > 5 ? (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-sage)" }} />
              <span style={{ color: "var(--lm-sage)" }}>In stock</span>
            </>
          ) : frame.stock > 0 ? (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-warm)" }} />
              <span style={{ color: "var(--lm-warm)" }}>Only {frame.stock} left</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--lm-faint)" }} />
              <span style={{ color: "var(--lm-faint)" }}>Out of stock</span>
            </>
          )}
        </div>

        {/* Add to bag */}
        <button
          type="button"
          onClick={handleAddToBag}
          disabled={outOfStock}
          className="lm-pill w-full justify-center py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? (
            "Out of stock"
          ) : (
            <>
              Add to bag <Icon name="arrow" size={16} />
            </>
          )}
        </button>

        {/* Lens builder — deferred to US-P2-02 */}
        <div
          className="rounded-xl px-5 py-4"
          style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-tint)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
            Full lens builder coming soon
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--lm-muted)" }}>
            Choose your lens type, prescription, and add-ons at checkout. Have a
            question? WhatsApp us at{" "}
            <a
              href="https://wa.me/233245628432"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
              style={{ color: "var(--lm-warm)" }}
            >
              +233 24 562 8432
            </a>
            .
          </p>
        </div>

        {frame.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--lm-muted)" }}>
            {frame.description}
          </p>
        )}
      </div>
    </div>
  );
}
