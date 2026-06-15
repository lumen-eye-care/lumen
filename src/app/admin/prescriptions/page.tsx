import Link from "next/link";
import { requireAdmin } from "@/server/auth-guards";
import { listPrescriptions } from "@/server/prescriptions";
import { PageHeader, Table, Th, Td, Alert, StatusBadge } from "../_components/admin-ui";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminPrescriptionsPage() {
  await requireAdmin();
  const prescriptions = await listPrescriptions();

  return (
    <>
      <PageHeader
        title="Prescriptions"
        description="Customer-uploaded prescriptions. Review the file, then verify or reject."
      />

      {prescriptions.length === 0 && (
        <div className="mb-4">
          <Alert kind="success">No prescriptions uploaded yet.</Alert>
        </div>
      )}

      {prescriptions.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>File</Th>
              <Th>Practitioner</Th>
              <Th>Uploaded</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link
                    href={`/admin/prescriptions/${p.id}`}
                    className="font-medium text-lumen-blue underline-offset-2 hover:underline"
                  >
                    {p.customer_name || p.customer_email || "Customer"}
                  </Link>
                </Td>
                <Td className="text-lumen-ink/70">
                  {p.original_name ?? p.mime_type}
                </Td>
                <Td className="text-lumen-ink/70">
                  {p.practitioner_name ?? <span className="text-lumen-ink/35">—</span>}
                </Td>
                <Td className="text-lumen-ink/50 text-xs">
                  {dateFmt.format(new Date(p.created_at))}
                </Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
