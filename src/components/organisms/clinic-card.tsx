import { Icon } from "@/components/atoms/icon";
import {
  formatGhanaPhone,
  formatWeek,
  isOpenNow,
  todayHours,
} from "@/lib/clinic-hours";
import { waMeUrl } from "@/lib/wa-link";
import type { Clinic } from "@/server/clinics";

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

  // TODO(US-P1-01): point booking at /book?clinic=<slug> once the
  // appointment-request flow lands; wa.me is the interim channel.
  const bookHref = clinic.whatsapp
    ? waMeUrl(
        clinic.whatsapp,
        `Hi! I'd like to book an eye test at the ${clinic.name}.`,
      )
    : clinic.phone
      ? `tel:${clinic.phone}`
      : null;

  return (
    <article
      id={clinic.slug}
      className="scroll-mt-24 overflow-hidden rounded-xl bg-white ring-1 ring-lumen-ink/8 md:grid md:grid-cols-[280px_1fr]"
    >
      {/* Map placeholder */}
      <div className="relative flex min-h-[160px] items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgba(15,76,129,0.12),transparent_60%)] bg-lumen-blue/5 md:min-h-full">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-lumen-ink shadow-sm ring-1 ring-lumen-ink/8">
          <Icon name="pin" size={12} className="text-lumen-blue" />
          {clinic.name}
        </span>
      </div>

      {/* Info */}
      <div className="p-6">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl text-lumen-ink">
            {clinic.name}
          </h2>
          {clinic.is_flagship && (
            <span className="inline-block shrink-0 rounded-full bg-lumen-sage/15 px-2.5 py-0.5 text-xs font-medium text-lumen-sage">
              Flagship
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-lumen-ink/60">{clinic.address}</p>

        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          {hours && (
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                open ? "text-lumen-sage" : "text-lumen-warm"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  open ? "bg-lumen-sage" : "bg-lumen-warm"
                }`}
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
          <span className="text-lumen-ink/50">
            {clinic.optometrist_count}{" "}
            {clinic.optometrist_count === 1 ? "optometrist" : "optometrists"}{" "}
            on staff
          </span>
        </div>

        {hours && (
          <div className="mb-5">
            <h3 className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lumen-ink/40">
              <Icon name="clock" size={12} />
              Opening hours
            </h3>
            <ul className="max-w-xs">
              {formatWeek(hours, now).map((row) => (
                <li
                  key={row.label}
                  className={`flex justify-between border-b border-lumen-ink/5 py-1 text-[13px] last:border-b-0 ${
                    row.isToday
                      ? "font-semibold text-lumen-ink"
                      : "text-lumen-ink/55"
                  }`}
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-lumen-ink/40">
              Services here
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {clinic.services.map((service) => (
                <li
                  key={service}
                  className="inline-flex items-center gap-1.5 rounded-full bg-lumen-ink/4 px-3 py-1 text-xs text-lumen-ink/70"
                >
                  <Icon name="check" size={10} className="text-lumen-sage" />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {bookHref && (
            <a
              href={bookHref}
              {...(bookHref.startsWith("https://wa.me/") ? EXTERNAL : {})}
              className="inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              Book here
              <Icon name="arrow" size={14} />
            </a>
          )}
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              title={formatGhanaPhone(clinic.phone)}
              className="inline-flex items-center gap-2 rounded-md border border-lumen-ink/15 px-4 py-2.5 text-sm text-lumen-ink transition-colors hover:bg-lumen-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              <Icon name="phone" size={14} />
              Call
            </a>
          )}
          {clinic.whatsapp && (
            <a
              href={waMeUrl(clinic.whatsapp)}
              {...EXTERNAL}
              className="inline-flex items-center gap-2 rounded-md border border-lumen-ink/15 px-4 py-2.5 text-sm text-lumen-ink transition-colors hover:bg-lumen-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
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
