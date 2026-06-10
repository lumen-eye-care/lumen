import Link from "next/link";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { Button } from "@/components/atoms/button";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Alert,
  StatusBadge,
} from "../_components/admin-ui";
import { archiveClinic, restoreClinic } from "./actions";

export const dynamic = "force-dynamic";

type ClinicRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  optometrist_count: number;
  is_flagship: boolean;
  is_active: boolean;
  sort_order: number;
};

export default async function AdminClinicsPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Admin RLS (`clinics admin write`, FOR ALL) returns archived rows too.
  const { data, error } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, address, optometrist_count, is_flagship, is_active, sort_order",
    )
    .order("is_active", { ascending: false })
    .order("sort_order");

  const clinics = (data ?? []) as ClinicRow[];

  return (
    <>
      <PageHeader
        title="Clinics"
        description="Locations shown on /clinics and in the site footer. Archived clinics stay in the database but disappear from the storefront."
        action={
          <Link href="/admin/clinics/new">
            <Button>New clinic</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert kind="error">Could not load clinics: {error.message}</Alert>
        </div>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Clinic</Th>
            <Th>Address</Th>
            <Th>Optometrists</Th>
            <Th>Sort</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {clinics.length === 0 && !error ? (
            <tr>
              <Td className="text-lumen-ink/50" colSpan={6}>
                No clinics yet. Create the first one.
              </Td>
            </tr>
          ) : (
            clinics.map((clinic) => (
              <tr key={clinic.id}>
                <Td>
                  <Link
                    href={`/admin/clinics/${clinic.id}/edit`}
                    className="font-medium text-lumen-blue underline-offset-2 hover:underline"
                  >
                    {clinic.name}
                  </Link>
                  {clinic.is_flagship && (
                    <span className="ml-2 inline-block rounded-full bg-lumen-sage/15 px-2 py-0.5 text-[11px] font-medium text-lumen-sage">
                      Flagship
                    </span>
                  )}
                </Td>
                <Td className="text-lumen-ink/70">{clinic.address}</Td>
                <Td>{clinic.optometrist_count}</Td>
                <Td>{clinic.sort_order}</Td>
                <Td>
                  <StatusBadge
                    status={clinic.is_active ? "active" : "archived"}
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/clinics/${clinic.id}/edit`}
                      className="text-sm text-lumen-blue underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                    {clinic.is_active ? (
                      <form action={archiveClinic}>
                        <input type="hidden" name="id" value={clinic.id} />
                        <button
                          type="submit"
                          className="text-sm text-lumen-warm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
                        >
                          Archive
                        </button>
                      </form>
                    ) : (
                      <form action={restoreClinic}>
                        <input type="hidden" name="id" value={clinic.id} />
                        <button
                          type="submit"
                          className="text-sm text-lumen-sage underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
                        >
                          Restore
                        </button>
                      </form>
                    )}
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
}
