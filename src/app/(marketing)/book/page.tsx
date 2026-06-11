import type { Metadata } from "next";
import Link from "next/link";
import { getActiveClinics } from "@/server/clinics";
import { Icon } from "@/components/atoms/icon";
import { EmptyState } from "@/components/atoms/empty-state";
import type { AppointmentService } from "@/lib/appointment-schemas";
import { APPOINTMENT_SERVICES } from "@/lib/appointment-schemas";
import { BookForm } from "./book-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request an Appointment",
  description:
    "Book an eye test, contact lens fitting, or home visit at a Lumen Eye Care clinic in Ghana.",
};

function isValidService(v: string): v is AppointmentService {
  return (APPOINTMENT_SERVICES as readonly string[]).includes(v);
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const clinicSlug =
    typeof params.clinic === "string" ? params.clinic : undefined;
  const serviceParam =
    typeof params.service === "string" ? params.service : undefined;

  const clinics = await getActiveClinics();

  const defaultService: AppointmentService =
    serviceParam && isValidService(serviceParam) ? serviceParam : "eye-test";

  if (clinics.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
        <EmptyState
          icon="pin"
          title="Clinics coming soon"
          description="Our locations are being finalised. Reach us via the contacts in the footer."
        />
      </main>
    );
  }

  // Prefer the clinic matching ?clinic=<slug>; fall back to flagship, then first.
  const defaultClinic =
    (clinicSlug ? clinics.find((c) => c.slug === clinicSlug) : null) ??
    clinics.find((c) => c.is_flagship) ??
    clinics[0];

  const clinicOptions = clinics.map((c) => ({ id: c.id, name: c.name }));

  const heading =
    defaultService === "home-visit"
      ? "Request a home visit"
      : "Request an appointment";

  return (
    <div className="min-h-screen bg-lumen-cream">
      {/* Hero */}
      <section className="border-b border-lumen-ink/8 px-6 pb-8 pt-8">
        <div className="mx-auto max-w-[1280px]">
          <nav
            className="mb-5 flex items-center gap-1.5 text-xs text-lumen-ink/40"
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
              href="/clinics"
              className="hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              Clinics
            </Link>
            <Icon name="chev" size={10} className="-rotate-90" />
            <span className="text-lumen-ink/70">Book</span>
          </nav>

          <h1 className="font-display text-4xl text-lumen-ink sm:text-5xl">
            {heading}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-lumen-ink/60">
            Fill in the form and our team will confirm your slot — usually
            within one business day.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="mx-auto max-w-lg">
          <BookForm
            clinics={clinicOptions}
            defaultClinicId={defaultClinic.id}
            defaultService={defaultService}
          />
        </div>
      </div>
    </div>
  );
}
