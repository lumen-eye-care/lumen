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
      className="lm-grain relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10 lg:p-14"
      style={{ background: "var(--lm-deepest)", color: "var(--lm-text)" }}
    >
      <div className="relative z-10">
        <p
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--lm-faint)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--lm-faint)" }} />
          Home visit eye tests
        </p>
        <h2
          id="home-visit-heading"
          className="lm-display mb-4 leading-[1.05]"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          Can&apos;t make it in?{" "}
          <em className="italic" style={{ color: "var(--lm-muted)" }}>
            We&apos;ll come to you.
          </em>
        </h2>
        <p className="mb-7 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--lm-muted)" }}>
          Full clinical equipment, brought to your home or office. Perfect for
          elderly patients, busy professionals, and families with young
          children. We cover all of Accra and Kumasi.
        </p>
        <div className="flex flex-wrap gap-3">
          {clinicSlug && (
            <Link
              href={`/book?clinic=${clinicSlug}&service=home-visit`}
              className="lm-pill"
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
              className="lm-ghost"
            >
              <Icon name="phone" size={14} />
              Chat on WhatsApp
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="lm-ghost">
              <Icon name="phone" size={14} />
              Call to discuss
            </a>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-8 lg:mt-0">
        <dl
          className="rounded-2xl p-6"
          style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-tint)" }}
        >
          {INFO_ROWS.map((row, i) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-3 text-[13.5px]"
              style={{
                borderBottom: i < INFO_ROWS.length - 1 ? "1px solid var(--lm-hair)" : "none",
              }}
            >
              <dt style={{ color: "var(--lm-faint)" }}>{row.label}</dt>
              <dd className="text-right font-medium" style={{ color: "var(--lm-text)" }}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--lm-warm) 20%, transparent), transparent 60%)",
        }}
      />
    </section>
  );
}
