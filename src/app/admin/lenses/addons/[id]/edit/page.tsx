import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { PageHeader } from "../../../../_components/admin-ui";
import { LensForm, type LensFormValues } from "../../../lens-form";
import { LENS_ADDON_GROUPS, type LensAddonGroup } from "@/lib/lens-schemas";

function asGroup(value: string): LensAddonGroup {
  return (LENS_ADDON_GROUPS as readonly string[]).includes(value)
    ? (value as LensAddonGroup)
    : "coating";
}

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditLensAddonPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lens_addons")
    .select(
      "id, name, slug, description, price_ghs, included, addon_group, single_select, sort_order, is_active",
    )
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
    included: data.included,
    group: asGroup(data.addon_group),
    single_select: data.single_select,
  };

  return (
    <>
      <PageHeader title={`Edit ${data.name}`} description="Lens add-on" />
      <LensForm kind="addon" mode="edit" values={values} />
    </>
  );
}
