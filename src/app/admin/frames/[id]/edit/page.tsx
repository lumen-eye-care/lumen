import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { PageHeader } from "../../../_components/admin-ui";
import { FrameForm, type FrameFormValues } from "../../frame-form";

export const dynamic = "force-dynamic";

type Color = { name: string; hex: string };

export default async function EditFramePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: frame }, { data: categories }] = await Promise.all([
    supabase
      .from("frames")
      .select(
        "id, name, slug, price_ghs, stock, category_id, description, shape, gender, material, badge, colors, photo_urls",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("frame_categories").select("id, name").order("sort_order"),
  ]);

  if (!frame) notFound();

  const values: FrameFormValues = {
    id: frame.id,
    name: frame.name,
    slug: frame.slug,
    price_ghs: frame.price_ghs,
    stock: frame.stock,
    category_id: frame.category_id,
    description: frame.description,
    shape: frame.shape,
    gender: frame.gender,
    material: frame.material,
    badge: frame.badge,
    colors: Array.isArray(frame.colors) ? (frame.colors as unknown as Color[]) : [],
    photo_urls: frame.photo_urls ?? [],
  };

  return (
    <>
      <PageHeader title={`Edit ${frame.name}`} description="Update catalogue details." />
      <FrameForm mode="edit" categories={categories ?? []} frame={values} />
    </>
  );
}
