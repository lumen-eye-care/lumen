import type { Metadata } from "next";
import { requireUser } from "@/server/auth-guards";
import { listOwnAppointments } from "@/server/appointments";
import { SERVICE_LABELS, type AppointmentService } from "@/lib/appointment-schemas";
import { EmptyState } from "@/components/atoms/empty-state";
import { AppointmentStatusPill } from "@/components/account/appointment-status-pill";

export const metadata: Metadata = {
  title: "My appointments",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", { dateStyle: "full" });
const bookedFmt = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" });

function serviceLabel(service: string): string {
  return SERVICE_LABELS[service as AppointmentService] ?? service;
}

export default async function AppointmentsPage() {
  await requireUser();
  const appointments = await listOwnAppointments();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          My appointments
        </h1>
        <p className="max-w-xl text-sm" style={{ color: "var(--lm-muted)" }}>
          Eye tests and fittings you&apos;ve requested. Our team confirms each one by
          phone or WhatsApp — you&apos;ll also get an email when the status changes.
        </p>
      </header>

      {appointments.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No appointments yet"
          description="Book an eye test, contact-lens fitting or home visit and it'll show up here."
          cta={{ label: "Book an appointment", href: "/book" }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {appointments.map((a) => (
            <li
              key={a.id}
              className="lm-card flex flex-wrap items-start justify-between gap-4 p-5"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-medium" style={{ color: "var(--lm-text)" }}>
                  {serviceLabel(a.service)}
                </span>
                <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
                  {a.clinic_name}
                </span>
                <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
                  {a.preferred_date
                    ? `Preferred: ${dateFmt.format(new Date(a.preferred_date))}`
                    : "Preferred date: to be confirmed"}
                </span>
                {a.notes && (
                  <p className="mt-1 text-sm" style={{ color: "var(--lm-faint)" }}>
                    {a.notes}
                  </p>
                )}
                <span className="mt-1 text-xs" style={{ color: "var(--lm-faint)" }}>
                  Requested {bookedFmt.format(new Date(a.created_at))}
                </span>
              </div>
              <AppointmentStatusPill status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
