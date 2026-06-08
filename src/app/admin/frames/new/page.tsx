import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { PageHeader } from "../../_components/admin-ui";
import { FrameForm } from "../frame-form";

export const dynamic = "force-dynamic";

export default async function NewFramePage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("frame_categories")
    .select("id, name")
    .order("sort_order");

  return (
    <>
      <PageHeader title="New frame" description="Add a frame to the catalogue." />
      <FrameForm mode="create" categories={data ?? []} />
    </>
  );
}
