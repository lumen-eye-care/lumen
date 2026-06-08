import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getFrameBySlug } from "@/server/frames";
import { formatGhs } from "@/lib/format-money";
import { FrameSVG } from "@/components/atoms/frame-svg";
import { Icon } from "@/components/atoms/icon";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frame = await getFrameBySlug(slug);
  if (!frame) return { title: "Frame not found" };
  return {
    title: frame.name,
    description: frame.description ?? `${frame.name} — ${frame.material ?? "premium eyewear"} by Lumen Eye Care.`,
  };
}

export default async function FrameDetailPage({ params }: Props) {
  const { slug } = await params;
  const frame = await getFrameBySlug(slug);

  if (!frame) notFound();

  const primaryPhoto = frame.photo_urls[0] ?? null;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Breadcrumb */}
      <nav
        className="mb-8 flex items-center gap-1.5 text-xs text-lumen-ink/40"
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          Home
        </Link>
        <Icon name="chev" size={10} className="-rotate-90" />
        <Link
          href={`/shop${frame.category ? `?cat=${frame.category.slug}` : ""}`}
          className="hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          Shop
        </Link>
        <Icon name="chev" size={10} className="-rotate-90" />
        <span className="text-lumen-ink/70">{frame.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image / SVG */}
        <div className="flex items-center justify-center rounded-2xl bg-[#F6F2EB] px-10 py-12">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={`${frame.name} frames`}
              width={480}
              height={320}
              className="h-auto w-full max-w-sm object-contain"
              priority
            />
          ) : (
            <FrameSVG
              shape={frame.shape}
              color={frame.colors[0]?.hex ?? "#1E3148"}
              className="w-full max-w-sm"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {frame.badge && (
            <span className="w-fit rounded-full bg-lumen-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lumen-blue">
              {frame.badge === "BESTSELLER"
                ? "Best seller"
                : frame.badge === "LIMITED"
                  ? "Limited edition"
                  : frame.badge}
            </span>
          )}

          <div>
            <h1 className="font-display text-4xl text-lumen-ink">{frame.name}</h1>
            {frame.material && (
              <p className="mt-1 text-sm text-lumen-ink/50">
                {[frame.material, frame.category?.name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          <div>
            <p className="text-3xl font-medium text-lumen-ink">
              {formatGhs(frame.price_ghs)}
            </p>
            <p className="mt-0.5 text-xs text-lumen-ink/50">
              Frame only · Lenses added at checkout
            </p>
          </div>

          {/* Colour swatches */}
          {frame.colors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-lumen-ink/50">
                Colours
              </p>
              <div className="flex flex-wrap gap-2">
                {frame.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-lumen-ink/15 ring-offset-2 transition-all hover:ring-2 hover:ring-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stock indicator */}
          <div className="flex items-center gap-2 text-sm">
            {frame.stock > 5 ? (
              <>
                <span className="h-2 w-2 rounded-full bg-lumen-sage" />
                <span className="text-lumen-sage">In stock</span>
              </>
            ) : frame.stock > 0 ? (
              <>
                <span className="h-2 w-2 rounded-full bg-lumen-warm" />
                <span className="text-lumen-warm">Only {frame.stock} left</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-lumen-ink/30" />
                <span className="text-lumen-ink/50">Out of stock</span>
              </>
            )}
          </div>

          {/* Coming soon notice */}
          <div className="rounded-xl border border-lumen-ink/8 bg-lumen-ink/[0.03] px-5 py-4">
            <p className="text-sm font-medium text-lumen-ink">
              Full lens builder coming soon
            </p>
            <p className="mt-1 text-xs leading-relaxed text-lumen-ink/50">
              Choose your lens type, prescription, and add-ons at checkout.
              Have a question? WhatsApp us at{" "}
              <a
                href="https://wa.me/233245628432"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lumen-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                +233 24 562 8432
              </a>
              .
            </p>
          </div>

          {frame.description && (
            <p className="text-sm leading-relaxed text-lumen-ink/70">
              {frame.description}
            </p>
          )}

          <Link
            href={`/shop${frame.category ? `?cat=${frame.category.slug}` : ""}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-lumen-blue transition-colors hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            <Icon name="arrowLeft" size={14} />
            Back to{" "}
            {frame.category?.name ? frame.category.name.toLowerCase() : "shop"}
          </Link>
        </div>
      </div>
    </div>
  );
}
