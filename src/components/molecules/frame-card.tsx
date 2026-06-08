import Link from "next/link";
import Image from "next/image";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { formatGhs } from "@/lib/format-money";
import type { ShopFrame } from "@/server/frames";

const BADGE_STYLES: Record<string, string> = {
  BESTSELLER: "bg-lumen-blue/10 text-lumen-blue",
  NEW: "bg-lumen-sage/15 text-lumen-sage",
  LIMITED: "bg-lumen-warm/15 text-lumen-warm",
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
      className="group flex flex-col rounded-xl bg-white ring-1 ring-lumen-ink/8 transition-shadow hover:shadow-[0_8px_24px_rgba(10,31,53,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
    >
      {/* Image / SVG area */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-t-xl bg-[#F6F2EB] px-6 py-8">
        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLES[badge] ?? "bg-lumen-ink/8 text-lumen-ink"}`}
          >
            {badge === "BESTSELLER"
              ? "Best seller"
              : badge === "LIMITED"
                ? "Limited"
                : badge}
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
            color={colors[0]?.hex ?? "#1E3148"}
            className="h-[140px] w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-[1.05rem] text-lumen-ink">
              {name}
            </p>
            {meta && (
              <p className="mt-0.5 truncate text-xs text-lumen-ink/50">{meta}</p>
            )}
          </div>
          <p className="shrink-0 text-right text-sm font-medium text-lumen-ink">
            <span className="text-xs font-normal text-lumen-ink/50">From </span>
            {formatGhs(price_ghs)}
          </p>
        </div>

        {/* Colour swatches */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5" aria-label="Available colours">
            {colors.map((c) => (
              <span
                key={c.name}
                className="h-[18px] w-[18px] rounded-full ring-1 ring-lumen-ink/15 ring-offset-1"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
