import Link from "next/link";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { Button } from "@/components/atoms/button";
import { formatGhs } from "@/lib/format-money";
import { PageHeader, Table, Th, Td, Alert, StatusBadge } from "../_components/admin-ui";
import {
  archiveLensType,
  restoreLensType,
  archiveLensAddon,
  restoreLensAddon,
} from "./actions";

export const dynamic = "force-dynamic";

type LensTypeRow = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  badge: string | null;
  sort_order: number;
  is_active: boolean;
};

type LensAddonRow = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  included: boolean;
  addon_group: string;
  single_select: boolean;
  sort_order: number;
  is_active: boolean;
};

const GROUP_LABEL: Record<string, string> = {
  coating: "Coating",
  sun: "Sun & tint",
  thickness: "Thickness",
};

function ArchiveRestore({
  id,
  isActive,
  archive,
  restore,
}: {
  id: string;
  isActive: boolean;
  archive: (fd: FormData) => void;
  restore: (fd: FormData) => void;
}) {
  return isActive ? (
    <form action={archive}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-lumen-warm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
      >
        Archive
      </button>
    </form>
  ) : (
    <form action={restore}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-lumen-sage underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
      >
        Restore
      </button>
    </form>
  );
}

export default async function AdminLensesPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Admin RLS (FOR ALL) returns archived rows too.
  const [typesRes, addonsRes] = await Promise.all([
    supabase
      .from("lens_types")
      .select("id, name, slug, price_ghs, badge, sort_order, is_active")
      .order("is_active", { ascending: false })
      .order("sort_order"),
    supabase
      .from("lens_addons")
      .select(
        "id, name, slug, price_ghs, included, addon_group, single_select, sort_order, is_active",
      )
      .order("is_active", { ascending: false })
      .order("sort_order"),
  ]);

  const lensTypes = (typesRes.data ?? []) as LensTypeRow[];
  const lensAddons = (addonsRes.data ?? []) as LensAddonRow[];
  const loadError = typesRes.error ?? addonsRes.error;

  return (
    <>
      <PageHeader
        title="Lenses"
        description="Lens types and add-ons shown in the product-page lens builder and priced at checkout. Archived options stay in the database but disappear from the storefront."
      />

      {loadError && (
        <div className="mb-4">
          <Alert kind="error">Could not load the lens catalogue: {loadError.message}</Alert>
        </div>
      )}

      {/* Lens types */}
      <div className="mb-4 mt-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-lumen-ink">Lens types</h2>
        <Link href="/admin/lenses/types/new">
          <Button>New lens type</Button>
        </Link>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Slug</Th>
            <Th>Price</Th>
            <Th>Badge</Th>
            <Th>Sort</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {lensTypes.length === 0 && !loadError ? (
            <tr>
              <Td className="text-lumen-ink/50" colSpan={7}>
                No lens types yet. Create the first one.
              </Td>
            </tr>
          ) : (
            lensTypes.map((t) => (
              <tr key={t.id}>
                <Td>
                  <Link
                    href={`/admin/lenses/types/${t.id}/edit`}
                    className="font-medium text-lumen-blue underline-offset-2 hover:underline"
                  >
                    {t.name}
                  </Link>
                </Td>
                <Td className="text-lumen-ink/70">{t.slug}</Td>
                <Td>{t.price_ghs > 0 ? formatGhs(t.price_ghs) : "Included"}</Td>
                <Td className="text-lumen-ink/70">{t.badge ?? "—"}</Td>
                <Td>{t.sort_order}</Td>
                <Td>
                  <StatusBadge status={t.is_active ? "active" : "archived"} />
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/lenses/types/${t.id}/edit`}
                      className="text-sm text-lumen-blue underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                    <ArchiveRestore
                      id={t.id}
                      isActive={t.is_active}
                      archive={archiveLensType}
                      restore={restoreLensType}
                    />
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Add-ons */}
      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-base font-semibold text-lumen-ink">Add-ons</h2>
        <Link href="/admin/lenses/addons/new">
          <Button>New add-on</Button>
        </Link>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Slug</Th>
            <Th>Group</Th>
            <Th>Price</Th>
            <Th>Included</Th>
            <Th>Sort</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {lensAddons.length === 0 && !loadError ? (
            <tr>
              <Td className="text-lumen-ink/50" colSpan={8}>
                No add-ons yet. Create the first one.
              </Td>
            </tr>
          ) : (
            lensAddons.map((a) => (
              <tr key={a.id}>
                <Td>
                  <Link
                    href={`/admin/lenses/addons/${a.id}/edit`}
                    className="font-medium text-lumen-blue underline-offset-2 hover:underline"
                  >
                    {a.name}
                  </Link>
                </Td>
                <Td className="text-lumen-ink/70">{a.slug}</Td>
                <Td className="text-lumen-ink/70">
                  {GROUP_LABEL[a.addon_group] ?? a.addon_group}
                  {a.single_select ? " · one only" : ""}
                </Td>
                <Td>{a.price_ghs > 0 ? formatGhs(a.price_ghs) : "Free"}</Td>
                <Td className="text-lumen-ink/70">{a.included ? "Yes" : "No"}</Td>
                <Td>{a.sort_order}</Td>
                <Td>
                  <StatusBadge status={a.is_active ? "active" : "archived"} />
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/lenses/addons/${a.id}/edit`}
                      className="text-sm text-lumen-blue underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                    <ArchiveRestore
                      id={a.id}
                      isActive={a.is_active}
                      archive={archiveLensAddon}
                      restore={restoreLensAddon}
                    />
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
