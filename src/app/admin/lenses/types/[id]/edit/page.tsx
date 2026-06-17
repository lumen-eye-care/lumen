import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { PageHeader } from "../../../../_components/admin-ui";
import { LensForm, type LensFormValues } from "../../../lens-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditLensTypePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lens_types")
    .select("id, name, slug, description, price_ghs, badge, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const values: LensFormValues = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    price_ghs: data.price_ghs,
    sort_order: data.sort_order,
    is_active: data.is_active,
    badge: data.badge,
  };

  return (
    <>
      <PageHeader title={`Edit ${data.name}`} description="Lens type" />
      <LensForm kind="type" mode="edit" values={values} />
    </>
  );
}
