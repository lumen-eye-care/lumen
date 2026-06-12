import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import type { Clinic } from "@/server/clinics";

/** Derive the city from an address ("…, East Legon, Accra" → "Accra"). */
function cityOf(address: string): string | null {
  const last = address.split(",").at(-1)?.trim();
  return last && last.length > 0 ? last : null;
}

/**
 * Closing CTA — dark field, warm glow, the eye-test booking call. Clinic count
 * and cities are derived from live data (nothing hardcodes "4 locations").
 */
export function ClinicsCta({ clinics }: { clinics: Clinic[] }) {
  const count = clinics.length;
  const cities = [
    ...new Set(
      clinics
        .map((c) => cityOf(c.address))
        .filter((c): c is string => c !== null),
    ),
  ];
  const where =
    cities.length > 0
      ? cities.slice(0, 3).join(", ")
      : "Accra & Kumasi";

  return (
    <section
      id="visit"
      className="relative overflow-hidden px-6 py-32 sm:py-44"
      style={{ background: "var(--pv-deepest)" }}
    >
      <div
        className="pv-glow"
        aria-hidden="true"
        style={{ width: 640, height: 640, bottom: "-30%", left: "50%", transform: "translateX(-50%)", opacity: 0.32 }}
      />
      <div className="relative z-10 mx-auto max-w-3xl text-center" data-stagger>
        <p className="pv-label">Visit us</p>
        <h2
          className="pv-display mx-auto mt-5 max-w-2xl"
          style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)" }}
        >
          Every great frame starts with an{" "}
          <em style={{ fontStyle: "italic", color: "var(--pv-warm)" }}>
            eye test
          </em>
          .
        </h2>
        <p
          className="mx-auto mt-6 max-w-md text-lg"
          style={{ color: "var(--pv-muted)" }}
        >
          {count > 0
            ? `Book with a Lumen optometrist across ${count} ${count === 1 ? "clinic" : "clinics"} in ${where}. Walk out seeing the difference.`
            : `Book with a Lumen optometrist in ${where}. Walk out seeing the difference.`}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/book" className="pv-pill">
            Book an eye test
            <Icon name="arrow" size={16} />
          </Link>
          <Link href="/clinics" className="pv-ghost">
            Find a clinic
            <Icon name="pin" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
