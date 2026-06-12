import Link from "next/link";
import Image from "next/image";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import type { ShopFrame } from "@/server/frames";

/**
 * Frames reel — the production-data moment. Real catalogue frames reveal in a
 * staggered grid as they scroll in; FrameSVG renders the silhouette until photo
 * uploads exist. Degrades to a curated FrameSVG showcase when no data loads, so
 * the section is never empty.
 */

const FALLBACK: { shape: string; tint: string }[] = [
  { shape: "aviator", tint: "#f2f2f0" },
  { shape: "round", tint: "#d97757" },
  { shape: "cateye", tint: "#3d6b5c" },
  { shape: "square", tint: "#f2f2f0" },
  { shape: "hex", tint: "#d97757" },
  { shape: "oval", tint: "#3d6b5c" },
];

export function FramesReel({ frames }: { frames: ShopFrame[] }) {
  const items = frames.slice(0, 6);
  const usingFallback = items.length === 0;

  return (
    <section id="frames" className="relative px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6" data-animate>
          <div>
            <p className="pv-label">The collection</p>
            <h2
              className="pv-display mt-4"
              style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}
            >
              Frames worth looking through.
            </h2>
          </div>
          <Link href="/shop" className="pv-ghost">
            View all frames
            <Icon name="arrow" size={16} />
          </Link>
        </div>

        <div
          data-stagger
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {usingFallback
            ? FALLBACK.map((f, i) => (
                <FallbackCard key={i} shape={f.shape} tint={f.tint} />
              ))
            : items.map((frame) => <FrameCardDark key={frame.id} frame={frame} />)}
        </div>
      </div>
    </section>
  );
}

function FrameCardDark({ frame }: { frame: ShopFrame }) {
  const photo = frame.photo_urls[0];
  return (
    <Link
      href={`/shop/${frame.slug}`}
      className="pv-card group block overflow-hidden p-6"
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
            <FrameSVG shape={frame.shape} color="#f2f2f0" />
          </div>
        )}
        {frame.badge && (
          <span
            className="absolute left-0 top-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
            style={{ background: "var(--pv-warm)", color: "#1a0f0a" }}
          >
            {frame.badge}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-medium" style={{ color: "var(--pv-text)" }}>
            {frame.name}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--pv-faint)" }}>
            {[frame.material, frame.category?.name]
              .filter(Boolean)
              .join(" · ") || "Eyewear"}
          </p>
        </div>
        <p className="text-base font-semibold" style={{ color: "var(--pv-warm)" }}>
          {formatGhs(frame.price_ghs)}
        </p>
      </div>

      {frame.colors.length > 0 && (
        <div className="mt-4 flex gap-1.5">
          {frame.colors.slice(0, 5).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-4 w-4 rounded-full ring-1 ring-white/20"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

function FallbackCard({ shape, tint }: { shape: string; tint: string }) {
  return (
    <div className="pv-card p-6">
      <div className="flex aspect-[4/3] items-center justify-center">
        <div className="w-3/4">
          <FrameSVG shape={shape} color={tint} />
        </div>
      </div>
      <p className="mt-5 text-sm" style={{ color: "var(--pv-faint)" }}>
        Catalogue loads from the live store.
      </p>
    </div>
  );
}
