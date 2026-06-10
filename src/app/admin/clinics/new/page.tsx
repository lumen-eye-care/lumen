import { requireAdmin } from "@/server/auth-guards";
import { PageHeader } from "../../_components/admin-ui";
import { ClinicForm } from "../clinic-form";

export const dynamic = "force-dynamic";

export default async function NewClinicPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="New clinic"
        description="Appears on /clinics and in the site footer as soon as it's created."
      />
      <ClinicForm mode="create" />
    </>
  );
}
