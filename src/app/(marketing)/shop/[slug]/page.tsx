import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFrameBySlug, getActiveFrames, type ShopFrame } from "@/server/frames";
import { getLensCatalogue } from "@/server/lenses";
import {
  prescriptionUploadEnabled,
  listBuilderPrescriptions,
} from "@/server/prescriptions";
import { formatGhs } from "@/lib/format-money";
import { FrameCard } from "@/components/molecules/frame-card";
import { FramePurchasePanel } from "@/components/organisms/frame-purchase-panel";
import { Frame3DSection } from "@/components/pdp/frame-3d-section";
import { resolveFrameModel } from "@/lib/frame-3d";
import { Icon } from "@/components/atoms/icon";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

/** ~160-char meta description: name + material + price, then the frame copy. */
function metaDescription(frame: ShopFrame): string {
  const summary = `${frame.name} — ${frame.material ?? "premium"} frames by Lumen Eye Care, ${formatGhs(frame.price_ghs)}.`;
  const body = frame.description?.trim();
  const full = body ? `${summary} ${body}` : summary;
  return full.length > 160 ? `${full.slice(0, 157).trimEnd()}…` : full;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frame = await getFrameBySlug(slug);
  if (!frame) return { title: "Frame not found" };
  const description = metaDescription(frame);
  return {
    title: frame.name,
    description,
    alternates: { canonical: `/shop/${frame.slug}` },
    openGraph: {
      title: frame.name,
      description,
      url: `/shop/${frame.slug}`,
      // Frame photo when uploaded; omitting falls back to the root
      // opengraph-image brand card.
      ...(frame.photo_urls.length > 0 && { images: [frame.photo_urls[0]] }),
    },
  };
}

/** schema.org Product for rich results (audit 2.2). Price in GHS, not pesewa. */
function productJsonLd(frame: ShopFrame, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: frame.name,
    ...(frame.description && { description: frame.description }),
    ...(frame.photo_urls.length > 0 && { image: frame.photo_urls }),
    ...(frame.material && { material: frame.material }),
    brand: { "@type": "Brand", name: "Lumen Eye Care" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/shop/${frame.slug}`,
      priceCurrency: "GHS",
      price: (frame.price_ghs / 100).toFixed(2),
      availability:
        frame.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
}

export default async function FrameDetailPage({ params }: Props) {
  const { slug } = await params;
  const frame = await getFrameBySlug(slug);

  if (!frame) notFound();

  // Lens builder data: catalogue + (when the flag is on) the visitor's on-file
  // prescriptions. listBuilderPrescriptions never redirects an anon visitor.
  const rxEnabled = prescriptionUploadEnabled();
  const [catalogue, onFilePrescriptions] = await Promise.all([
    getLensCatalogue(),
    rxEnabled ? listBuilderPrescriptions() : Promise.resolve([]),
  ]);

  // "You might also like" — same category, current frame excluded, first 4.
  const related = (
    await getActiveFrames(frame.category?.slug)
  )
    .filter((f) => f.id !== frame.id)
    .slice(0, 4);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Phase-3 POC: null unless NEXT_PUBLIC_DEMO_3D_ENABLED=true (off in prod).
  const modelSrc = resolveFrameModel();

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Product JSON-LD — Next's documented pattern needs dangerouslySetInnerHTML;
          input is our own DB row and "<" is escaped, so no script breakout. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(frame, siteUrl)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      {/* Breadcrumb */}
      <nav
        className="mb-8 flex items-center gap-1.5 text-xs"
        style={{ color: "var(--lm-faint)" }}
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
        >
          Home
        </Link>
        <Icon name="chev" size={10} className="-rotate-90" />
        <Link
          href={`/shop${frame.category ? `?cat=${frame.category.slug}` : ""}`}
          className="transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
        >
          Shop
        </Link>
        <Icon name="chev" size={10} className="-rotate-90" />
        <span style={{ color: "var(--lm-muted)" }}>{frame.name}</span>
      </nav>

      <FramePurchasePanel
        frame={frame}
        catalogue={catalogue}
        prescriptionUploadEnabled={rxEnabled}
        onFilePrescriptions={onFilePrescriptions}
      />

      {/* 3D / AR preview (Phase-3 POC, flag-gated) */}
      {modelSrc && (
        <Frame3DSection
          modelSrc={modelSrc}
          name={frame.name}
          poster={frame.photo_urls[0]}
        />
      )}

      {/* Related frames */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="lm-display mb-6 text-2xl" style={{ color: "var(--lm-text)" }}>
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
        className="mt-10 inline-flex items-center gap-2 text-sm transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
        style={{ color: "var(--lm-warm)" }}
      >
        <Icon name="arrowLeft" size={14} />
        Back to {frame.category?.name ? frame.category.name.toLowerCase() : "shop"}
      </Link>
    </div>
  );
}
