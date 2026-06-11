import Link from "next/link";
import { requireAdmin } from "@/server/auth-guards";
import { listAppointments } from "@/server/appointments";
import { SERVICE_LABELS } from "@/lib/appointment-schemas";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Alert,
  StatusBadge,
} from "../_components/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const appointments = await listAppointments();

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Appointment requests from /book. Update status to confirm, cancel, or mark complete."
      />

      {appointments.length === 0 && (
        <div className="mb-4">
          <Alert kind="success">No appointment requests yet.</Alert>
        </div>
      )}

      {appointments.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Clinic</Th>
              <Th>Service</Th>
              <Th>Preferred date</Th>
              <Th>Received</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <Td>
                  <Link
                    href={`/admin/appointments/${appt.id}`}
                    className="font-medium text-lumen-blue underline-offset-2 hover:underline"
                  >
                    {appt.name}
                  </Link>
                </Td>
                <Td className="text-lumen-ink/70">{appt.clinic_name}</Td>
                <Td className="text-lumen-ink/70">
                  {SERVICE_LABELS[appt.service as keyof typeof SERVICE_LABELS] ??
                    appt.service}
                </Td>
                <Td className="text-lumen-ink/70">
                  {appt.preferred_date ?? <span className="text-lumen-ink/35">—</span>}
                </Td>
                <Td className="text-lumen-ink/50 text-xs">
                  {new Date(appt.created_at).toLocaleDateString("en-GH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Td>
                <Td>
                  <StatusBadge status={appt.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
