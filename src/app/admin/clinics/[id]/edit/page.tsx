import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { parseOpeningHours } from "@/lib/clinic-hours";
import { PageHeader } from "../../../_components/admin-ui";
import { ClinicForm, type ClinicFormValues } from "../../clinic-form";

export const dynamic = "force-dynamic";

export default async function EditClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, address, phone, whatsapp, optometrist_count, services, opening_hours, is_flagship, latitude, longitude, sort_order",
    )
    .eq("id", id)
    .maybeSingle();

  if (!clinic) notFound();

  const values: ClinicFormValues = {
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    address: clinic.address,
    phone: clinic.phone,
    whatsapp: clinic.whatsapp,
    optometrist_count: clinic.optometrist_count,
    services: clinic.services ?? [],
    opening_hours: parseOpeningHours(clinic.opening_hours),
    is_flagship: clinic.is_flagship,
    latitude: clinic.latitude,
    longitude: clinic.longitude,
    sort_order: clinic.sort_order,
  };

  return (
    <>
      <PageHeader
        title={`Edit ${clinic.name}`}
        description="Update location details, hours and services."
      />
      <ClinicForm mode="edit" clinic={values} />
    </>
  );
}
