import { Icon } from "@/components/atoms/icon";
import {
  formatGhanaPhone,
  formatWeek,
  isOpenNow,
  todayHours,
} from "@/lib/clinic-hours";
import { waMeUrl } from "@/lib/wa-link";
import type { Clinic } from "@/server/clinics";
import Link from "next/link";

/**
 * One clinic on /clinics (US-P0-09). Server component — every action is a
 * plain anchor (tel / wa.me), so no client JS ships for this page.
 *
 * The map block is a styled placeholder by design: no map SDK in v1
 * (CSP + bundle budget). Coordinates stay in the DB for a later embed.
 */

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

export function ClinicCard({ clinic, now }: { clinic: Clinic; now: Date }) {
  const hours = clinic.opening_hours;
  const open = hours ? isOpenNow(hours, now) : null;

  const bookHref = `/book?clinic=${clinic.slug}`;

  return (
    <article
      id={clinic.slug}
      className="lm-card scroll-mt-24 overflow-hidden md:grid md:grid-cols-[280px_1fr]"
    >
      {/* Map placeholder */}
      <div
        className="relative flex min-h-[160px] items-center justify-center md:min-h-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--lm-warm) 12%, transparent), transparent 60%), var(--lm-deep)",
        }}
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{
            background: "var(--lm-raise)",
            color: "var(--lm-text)",
            border: "1px solid var(--lm-hair)",
          }}
        >
          <Icon name="pin" size={12} style={{ color: "var(--lm-warm)" }} />
          {clinic.name}
        </span>
      </div>

      {/* Info */}
      <div className="p-6">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h2 className="lm-display text-2xl" style={{ color: "var(--lm-text)" }}>
            {clinic.name}
          </h2>
          {clinic.is_flagship && (
            <span
              className="inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: "color-mix(in srgb, var(--lm-sage) 15%, transparent)",
                color: "var(--lm-sage)",
              }}
            >
              Flagship
            </span>
          )}
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--lm-muted)" }}>
          {clinic.address}
        </p>

        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          {hours && (
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: open ? "var(--lm-sage)" : "var(--lm-warm)" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: open ? "var(--lm-sage)" : "var(--lm-warm)" }}
              />
              {open
                ? `Open · ${todayHours(hours, now)}`
                : `Closed now${
                    todayHours(hours, now) === "Closed"
                      ? " · closed today"
                      : ` · today ${todayHours(hours, now)}`
                  }`}
            </span>
          )}
          <span style={{ color: "var(--lm-faint)" }}>
            {clinic.optometrist_count}{" "}
            {clinic.optometrist_count === 1 ? "optometrist" : "optometrists"}{" "}
            on staff
          </span>
        </div>

        {hours && (
          <div className="mb-5">
            <h3
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--lm-faint)" }}
            >
              <Icon name="clock" size={12} />
              Opening hours
            </h3>
            <ul className="max-w-xs">
              {formatWeek(hours, now).map((row) => (
                <li
                  key={row.label}
                  className="flex justify-between border-b py-1 text-[13px] last:border-b-0"
                  style={{
                    borderColor: "var(--lm-hair)",
                    color: row.isToday ? "var(--lm-text)" : "var(--lm-muted)",
                    fontWeight: row.isToday ? 600 : 400,
                  }}
                >
                  <span>
                    {row.label}
                    {row.isToday && " (today)"}
                  </span>
                  <span>{row.display}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {clinic.services.length > 0 && (
          <div className="mb-6">
            <h3
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--lm-faint)" }}
            >
              Services here
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {clinic.services.map((service) => (
                <li
                  key={service}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                  style={{
                    background: "var(--lm-tint)",
                    color: "var(--lm-muted)",
                  }}
                >
                  <Icon name="check" size={10} style={{ color: "var(--lm-sage)" }} />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <Link href={bookHref} className="lm-pill">
            Book here
            <Icon name="arrow" size={14} />
          </Link>
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              title={formatGhanaPhone(clinic.phone)}
              className="lm-ghost"
            >
              <Icon name="phone" size={14} />
              Call
            </a>
          )}
          {clinic.whatsapp && (
            <a
              href={waMeUrl(clinic.whatsapp)}
              {...EXTERNAL}
              className="lm-ghost"
            >
              <Icon name="phone" size={14} />
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
