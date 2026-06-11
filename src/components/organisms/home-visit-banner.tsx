import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import { waMeUrl } from "@/lib/wa-link";

/**
 * Home-visit eye tests banner on /clinics. Copy and fee table come from the
 * prototype (docs/design/clinics.jsx) — there's no DB table for this content
 * in v1, so it's intentionally hardcoded here.
 */

const INFO_ROWS = [
  { label: "Visit fee", value: "₵250" },
  { label: "Includes", value: "30-min full exam + retinal imaging" },
  { label: "Equipment", value: "Portable autorefractor + slit lamp" },
  { label: "Coverage", value: "Accra · Kumasi" },
  { label: "Available", value: "Tue – Sat · 9am – 5pm" },
];

type HomeVisitBannerProps = {
  /** Slug of the flagship clinic (for /book CTA). */
  clinicSlug: string | null;
  /** E.164 WhatsApp number — kept as secondary "chat" CTA. */
  whatsapp: string | null;
  phone: string | null;
};

export function HomeVisitBanner({ clinicSlug, whatsapp, phone }: HomeVisitBannerProps) {
  return (
    <section
      aria-labelledby="home-visit-heading"
      className="relative overflow-hidden rounded-3xl bg-lumen-ink px-6 py-10 text-white sm:px-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10 lg:p-14"
    >
      <div className="relative z-10">
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lumen-cream/70">
          <span className="h-1.5 w-1.5 rounded-full bg-lumen-cream/70" />
          Home visit eye tests
        </p>
        <h2
          id="home-visit-heading"
          className="mb-4 font-display text-4xl leading-[1.05] sm:text-5xl"
        >
          Can&apos;t make it in?{" "}
          <em className="italic text-lumen-cream/80">
            We&apos;ll come to you.
          </em>
        </h2>
        <p className="mb-7 max-w-lg text-[15px] leading-relaxed text-white/70">
          Full clinical equipment, brought to your home or office. Perfect for
          elderly patients, busy professionals, and families with young
          children. We cover all of Accra and Kumasi.
        </p>
        <div className="flex flex-wrap gap-3">
          {clinicSlug && (
            <Link
              href={`/book?clinic=${clinicSlug}&service=home-visit`}
              className="inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-3 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-blue/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
            >
              Book a home visit
              <Icon name="arrow" size={14} />
            </Link>
          )}
          {whatsapp && (
            <a
              href={waMeUrl(whatsapp, "Hi! I'd like to book a home visit eye test.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
            >
              <Icon name="phone" size={14} />
              Chat on WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
            >
              <Icon name="phone" size={14} />
              Call to discuss
            </a>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-8 lg:mt-0">
        <dl className="rounded-2xl border border-white/10 bg-white/4 p-6">
          {INFO_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-baseline justify-between gap-4 py-3 text-[13.5px] ${
                i < INFO_ROWS.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <dt className="text-white/50">{row.label}</dt>
              <dd className="text-right font-medium text-white">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] bg-[radial-gradient(circle,rgba(15,76,129,0.4),transparent_60%)]"
      />
    </section>
  );
}
