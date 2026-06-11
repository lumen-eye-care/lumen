import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { getAppointment } from "@/server/appointments";
import { SERVICE_LABELS, APPOINTMENT_STATUSES } from "@/lib/appointment-schemas";
import { PageHeader, StatusBadge, Alert } from "../../_components/admin-ui";
import { setAppointmentStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const appt = await getAppointment(id);
  if (!appt) notFound();

  const serviceLabel =
    SERVICE_LABELS[appt.service as keyof typeof SERVICE_LABELS] ?? appt.service;

  return (
    <>
      <PageHeader
        title={`Appointment — ${appt.name}`}
        description={`${serviceLabel} at ${appt.clinic_name}`}
        action={
          <Link
            href="/admin/appointments"
            className="text-sm text-lumen-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            ← All appointments
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Detail card */}
        <div className="rounded-lg border border-lumen-ink/10 bg-white p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Name", value: appt.name },
              { label: "Phone", value: appt.phone },
              { label: "Email", value: appt.email },
              { label: "Clinic", value: appt.clinic_name },
              { label: "Service", value: serviceLabel },
              {
                label: "Preferred date",
                value: appt.preferred_date ?? "Not specified",
              },
              {
                label: "Received",
                value: new Date(appt.created_at).toLocaleString("en-GH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-lumen-ink/40">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm text-lumen-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {appt.notes && (
            <div className="mt-5 border-t border-lumen-ink/8 pt-5">
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-lumen-ink/40">
                Notes
              </dt>
              <dd className="text-sm text-lumen-ink">{appt.notes}</dd>
            </div>
          )}
        </div>

        {/* Status panel */}
        <div className="rounded-lg border border-lumen-ink/10 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-lumen-ink/60">
            Status
          </h2>
          <div className="mb-4">
            <StatusBadge status={appt.status} />
          </div>

          {appt.status !== "completed" && appt.status !== "cancelled" && (
            <>
              <p className="mb-3 text-xs text-lumen-ink/50">Update status:</p>
              <div className="flex flex-col gap-2">
                {APPOINTMENT_STATUSES.filter((s) => s !== appt.status).map(
                  (s) => (
                    <form key={s} action={setAppointmentStatus}>
                      <input type="hidden" name="id" value={appt.id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        type="submit"
                        className={`w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue ${
                          s === "confirmed"
                            ? "border-lumen-sage/30 bg-lumen-sage/8 text-lumen-sage hover:bg-lumen-sage/15"
                            : s === "cancelled"
                              ? "border-lumen-warm/30 bg-lumen-warm/8 text-lumen-warm hover:bg-lumen-warm/15"
                              : "border-lumen-ink/15 bg-white text-lumen-ink/70 hover:bg-lumen-ink/5"
                        }`}
                      >
                        Mark as {s}
                      </button>
                    </form>
                  ),
                )}
              </div>
            </>
          )}

          {(appt.status === "completed" || appt.status === "cancelled") && (
            <Alert kind="success">This appointment is {appt.status}.</Alert>
          )}
        </div>
      </div>
    </>
  );
}
