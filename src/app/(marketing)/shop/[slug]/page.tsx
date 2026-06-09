import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFrameBySlug, getActiveFrames } from "@/server/frames";
import { FrameCard } from "@/components/molecules/frame-card";
import { FramePurchasePanel } from "@/components/organisms/frame-purchase-panel";
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
    description:
      frame.description ??
      `${frame.name} — ${frame.material ?? "premium eyewear"} by Lumen Eye Care.`,
  };
}

export default async function FrameDetailPage({ params }: Props) {
  const { slug } = await params;
  const frame = await getFrameBySlug(slug);

  if (!frame) notFound();

  // "You might also like" — same category, current frame excluded, first 4.
  const related = (
    await getActiveFrames(frame.category?.slug)
  )
    .filter((f) => f.id !== frame.id)
    .slice(0, 4);

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

      <FramePurchasePanel frame={frame} />

      {/* Related frames */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl text-lumen-ink">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {related.map((f) => (
              <FrameCard key={f.id} frame={f} />
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <Link
        href={`/shop${frame.category ? `?cat=${frame.category.slug}` : ""}`}
        className="mt-10 inline-flex items-center gap-2 text-sm text-lumen-blue transition-colors hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
      >
        <Icon name="arrowLeft" size={14} />
        Back to {frame.category?.name ? frame.category.name.toLowerCase() : "shop"}
      </Link>
    </div>
  );
}
