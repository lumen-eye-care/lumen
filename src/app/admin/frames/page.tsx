import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";
import { Button } from "@/components/atoms/button";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Alert,
  StatusBadge,
} from "../_components/admin-ui";
import { archiveFrame, restoreFrame } from "./actions";

export const dynamic = "force-dynamic";

type FrameRow = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  stock: number;
  is_active: boolean;
  photo_urls: string[];
  frame_categories: { name: string } | null;
};

export default async function AdminFramesPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Admin RLS (`frames admin write`, FOR ALL) returns archived rows too.
  const { data, error } = await supabase
    .from("frames")
    .select("id, name, slug, price_ghs, stock, is_active, photo_urls, frame_categories(name)")
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  const frames = (data ?? []) as unknown as FrameRow[];

  return (
    <>
      <PageHeader
        title="Frames"
        description="Manage the catalogue. Archived frames stay hidden from the shop but keep their order history."
        action={
          <Link href="/admin/frames/new">
            <Button>New frame</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert kind="error">Could not load frames: {error.message}</Alert>
        </div>
      )}

      {frames.length === 0 ? (
        <p className="text-sm text-lumen-ink/60">
          No frames yet.{" "}
          <Link href="/admin/frames/new" className="text-lumen-blue hover:underline">
            Add the first one
          </Link>
          .
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Frame</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {frames.map((f) => (
              <tr key={f.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-lumen-ink/10 bg-lumen-cream">
                      {f.photo_urls?.[0] ? (
                        <Image
                          src={f.photo_urls[0]}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-lumen-ink">{f.name}</span>
                      <span className="text-xs text-lumen-ink/50">{f.slug}</span>
                    </div>
                  </div>
                </Td>
                <Td>{formatGhs(f.price_ghs)}</Td>
                <Td>{f.stock}</Td>
                <Td>{f.frame_categories?.name ?? "—"}</Td>
                <Td>
                  <StatusBadge status={f.is_active ? "active" : "archived"} />
                </Td>
                <Td>
                  <div className="flex items-center gap-3 text-sm">
                    <Link
                      href={`/admin/frames/${f.id}/edit`}
                      className="text-lumen-blue underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={f.is_active ? archiveFrame : restoreFrame}>
                      <input type="hidden" name="id" value={f.id} />
                      <button
                        type="submit"
                        className="text-lumen-ink/60 underline-offset-2 hover:text-lumen-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
                      >
                        {f.is_active ? "Archive" : "Restore"}
                      </button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
