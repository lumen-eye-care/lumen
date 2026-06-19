import Link from "next/link";
import Image from "next/image";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { formatGhs } from "@/lib/format-money";
import type { ShopFrame } from "@/server/frames";

const BADGE_LABELS: Record<string, string> = {
  BESTSELLER: "Best seller",
  LIMITED: "Limited",
  NEW: "New",
};

type FrameCardProps = {
  frame: ShopFrame;
  /** Priority-load the image (above the fold — first row only). */
  priority?: boolean;
};

export function FrameCard({ frame, priority = false }: FrameCardProps) {
  const { slug, name, price_ghs, badge, shape, material, colors, photo_urls, category } =
    frame;

  const primaryPhoto = photo_urls[0] ?? null;
  const meta = [material, category?.name].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/shop/${slug}`}
      className="lm-card group flex flex-col overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
    >
      {/* Image / SVG area */}
      <div
        className="relative flex items-center justify-center overflow-hidden px-6 py-8"
        style={{ background: "var(--lm-deep)" }}
      >
        {badge && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: "var(--lm-warm)", color: "#1a0f0a" }}
          >
            {BADGE_LABELS[badge] ?? badge}
          </span>
        )}

        {primaryPhoto ? (
          <Image
            src={primaryPhoto}
            alt={`${name} frames`}
            width={280}
            height={180}
            className="h-[140px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        ) : (
          <FrameSVG
            shape={shape}
            color="var(--lm-text)"
            className="h-[140px] w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <p
            className="truncate font-display text-[1.05rem]"
            style={{ color: "var(--lm-text)" }}
          >
            {name}
          </p>
          {meta && (
            <p
              className="mt-0.5 truncate text-xs"
              style={{ color: "var(--lm-faint)" }}
            >
              {meta}
            </p>
          )}
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--lm-warm-text)" }}>
          <span
            className="text-xs font-normal"
            style={{ color: "var(--lm-faint)" }}
          >
            From{" "}
          </span>
          {formatGhs(price_ghs)}
        </p>

        {/* Colour swatches */}
        {colors.length > 0 && (
          <div
            className="mt-auto flex items-center gap-1.5 pt-1"
            aria-label="Available colours"
          >
            {colors.map((c) => (
              <span
                key={c.name}
                className="h-[18px] w-[18px] rounded-full"
                style={{
                  backgroundColor: c.hex,
                  outline: "1px solid var(--lm-hair)",
                  outlineOffset: "1px",
                }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
