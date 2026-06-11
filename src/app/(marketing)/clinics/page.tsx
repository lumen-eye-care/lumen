import type { Metadata } from "next";
import Link from "next/link";
import { getActiveClinics } from "@/server/clinics";
import { ClinicCard } from "@/components/organisms/clinic-card";
import { HomeVisitBanner } from "@/components/organisms/home-visit-banner";
import { EmptyState } from "@/components/atoms/empty-state";
import { Icon } from "@/components/atoms/icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clinics & Eye Tests",
  description:
    "Lumen eye clinics across Ghana — eye tests, contact lens fitting and glasses fitting, plus home visits in Accra and Kumasi.",
};

/** "Accra" from "12 Lagos Avenue, East Legon, Accra". */
function cityFromAddress(address: string): string | null {
  const last = address.split(",").at(-1)?.trim();
  return last && last.length > 0 ? last : null;
}

export default async function ClinicsPage() {
  const clinics = await getActiveClinics();
  // One timestamp per request so every card agrees on "open now".
  const now = new Date();

  const cities = [
    ...new Set(
      clinics
        .map((c) => cityFromAddress(c.address))
        .filter((city): city is string => city !== null),
    ),
  ];
  const cityList = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(cities);

  const flagship = clinics.find((c) => c.is_flagship) ?? clinics[0] ?? null;

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-lumen-ink/8 bg-lumen-cream px-6 pb-10 pt-8 text-center">
        <div className="mx-auto max-w-[1280px]">
          <nav
            className="mb-5 flex items-center justify-center gap-1.5 text-xs text-lumen-ink/40"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              Home
            </Link>
            <Icon name="chev" size={10} className="-rotate-90" />
            <span className="text-lumen-ink/70">Clinics</span>
          </nav>

          {clinics.length > 0 && (
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lumen-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-lumen-blue" />
              {clinics.length}{" "}
              {clinics.length === 1 ? "location" : "locations"} in Ghana
            </p>
          )}
          <h1 className="mb-3 font-display text-4xl text-lumen-ink sm:text-5xl">
            Care, close to <em className="italic">where you are.</em>
          </h1>
          {clinics.length > 0 && (
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-lumen-ink/60">
              {clinics.length === 1
                ? `Our clinic in ${cityList}`
                : `${clinics.length} locations across ${cityList}`}
              , plus home visits. Every clinic has the same equipment and the
              same clinical standard.
            </p>
          )}
        </div>
      </section>

      {/* ── Clinic cards ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        {clinics.length === 0 ? (
          <EmptyState
            icon="pin"
            title="Clinic details are on the way"
            description="We're finalising our locations. Check back soon — or reach us from the contact details in the footer."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {clinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} now={now} />
            ))}
          </div>
        )}

        {/* ── Home visits ─────────────────────────────────────────────────── */}
        <div className="mt-14">
          <HomeVisitBanner
            clinicSlug={flagship?.slug ?? null}
            whatsapp={flagship?.whatsapp ?? null}
            phone={flagship?.phone ?? null}
          />
        </div>
      </div>
    </div>
  );
}
