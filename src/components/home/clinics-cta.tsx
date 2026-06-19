import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import type { Clinic } from "@/server/clinics";

/** Derive the city from an address ("…, East Legon, Accra" → "Accra"). */
function cityOf(address: string): string | null {
  const last = address.split(",").at(-1)?.trim();
  return last && last.length > 0 ? last : null;
}

/**
 * Closing CTA — darkest surface, warm glow, the eye-test booking call. Clinic
 * count and cities are derived from live data (nothing hardcodes "4 locations").
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
    cities.length > 0 ? cities.slice(0, 3).join(", ") : "Accra & Kumasi";

  return (
    <section
      id="visit"
      className="lm-grain relative overflow-hidden px-6 py-28 sm:py-40"
      style={{ background: "var(--lm-deepest)", scrollMarginTop: "var(--nav-h)" }}
    >
      <div
        className="lm-glow lm-glow-pulse"
        aria-hidden="true"
        style={{
          width: 640,
          height: 640,
          bottom: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl text-center" data-stagger>
        <p className="lm-label">Visit us</p>
        <h2
          className="lm-display mx-auto mt-5 max-w-2xl"
          style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)" }}
        >
          Every great frame starts with an{" "}
          <em style={{ fontStyle: "italic", color: "var(--lm-warm-text)" }}>
            eye test
          </em>
          .
        </h2>
        <p
          className="mx-auto mt-6 max-w-md text-lg"
          style={{ color: "var(--lm-muted)" }}
        >
          {count > 0
            ? `Book with a Lumen optometrist across ${count} ${count === 1 ? "clinic" : "clinics"} in ${where}. Walk out seeing the difference.`
            : `Book with a Lumen optometrist in ${where}. Walk out seeing the difference.`}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/book" className="lm-pill">
            Book an eye test
            <Icon name="arrow" size={16} />
          </Link>
          <Link href="/clinics" className="lm-ghost">
            Find a clinic
            <Icon name="pin" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
