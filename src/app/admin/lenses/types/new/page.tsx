import { requireAdmin } from "@/server/auth-guards";
import { PageHeader } from "../../../_components/admin-ui";
import { LensForm } from "../../lens-form";

export const dynamic = "force-dynamic";

export default async function NewLensTypePage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New lens type"
        description="Appears in the product-page lens builder as soon as it's active."
      />
      <LensForm kind="type" mode="create" />
    </>
  );
}
