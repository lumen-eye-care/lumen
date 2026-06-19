import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { getPrescription } from "@/server/prescriptions";
import { isStaleIssueDate, type RxValues } from "@/lib/prescription-schemas";
import { OpenFileButton } from "@/components/prescriptions/open-file-button";
import { PageHeader, StatusBadge, Alert } from "../../_components/admin-ui";
import { reviewPrescription, getAdminPrescriptionUrl } from "../actions";

export const dynamic = "force-dynamic";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Signed dioptre, e.g. +1.25 / -0.50; null → em dash. */
function fmtDioptre(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
}

/** Structured manual Rx as a per-eye table. */
function ManualRxTable({ rx }: { rx: RxValues }) {
  const rows = [
    { eye: "Right (OD)", e: rx.right },
    { eye: "Left (OS)", e: rx.left },
  ];
  return (
    <div className="mt-5 border-t border-lumen-ink/8 pt-5">
      <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-lumen-ink/40">
        Prescription values
      </dt>
      <table className="w-full border-collapse text-sm text-lumen-ink">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-lumen-ink/40">
            <th className="py-1 pr-3 font-medium">Eye</th>
            <th className="py-1 pr-3 font-medium">SPH</th>
            <th className="py-1 pr-3 font-medium">CYL</th>
            <th className="py-1 pr-3 font-medium">Axis</th>
            <th className="py-1 font-medium">Add</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ eye, e }) => (
            <tr key={eye} className="border-t border-lumen-ink/8">
              <td className="py-1.5 pr-3 font-medium">{eye}</td>
              <td className="py-1.5 pr-3 tabular-nums">{fmtDioptre(e.sph)}</td>
              <td className="py-1.5 pr-3 tabular-nums">{fmtDioptre(e.cyl)}</td>
              <td className="py-1.5 pr-3 tabular-nums">{e.axis ?? "—"}</td>
              <td className="py-1.5 tabular-nums">{fmtDioptre(e.add)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-lumen-ink/50">
        PD: {rx.pd != null ? `${rx.pd} mm` : "Not specified"}
      </p>
    </div>
  );
}

export default async function AdminPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const p = await getPrescription(id);
  if (!p) notFound();

  const stale = isStaleIssueDate(p.issued_on);
  const isManual = p.source === "manual";

  return (
    <>
      <PageHeader
        title={`Prescription — ${p.customer_name || p.customer_email || "Customer"}`}
        description={
          isManual
            ? "Manually entered values — review, then verify or reject."
            : "Open the file (access is logged), then verify or reject."
        }
        action={
          <Link
            href="/admin/prescriptions"
            className="text-sm text-lumen-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            ← All prescriptions
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Detail card */}
        <div className="rounded-lg border border-lumen-ink/10 bg-white p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Customer", value: p.customer_name || "—" },
              { label: "Email", value: p.customer_email || "—" },
              { label: "Source", value: isManual ? "Manual entry" : "Uploaded file" },
              ...(isManual
                ? []
                : [
                    { label: "File", value: p.original_name || p.mime_type || "—" },
                    {
                      label: "Type / size",
                      value: `${p.mime_type ?? "—"} · ${
                        p.size_bytes != null ? formatSize(p.size_bytes) : "—"
                      }`,
                    },
                  ]),
              { label: "Practitioner", value: p.practitioner_name || "Not specified" },
              {
                label: "Date issued",
                value: p.issued_on
                  ? `${p.issued_on}${stale ? " (over a year old)" : ""}`
                  : "Not specified",
              },
              {
                label: "Submitted",
                value: new Date(p.created_at).toLocaleString("en-GH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-lumen-ink/40">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm text-lumen-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {p.notes && (
            <div className="mt-5 border-t border-lumen-ink/8 pt-5">
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-lumen-ink/40">
                Customer notes
              </dt>
              <dd className="text-sm text-lumen-ink">{p.notes}</dd>
            </div>
          )}

          {isManual ? (
            p.rx_values ? (
              <ManualRxTable rx={p.rx_values} />
            ) : (
              <p className="mt-6 text-sm text-lumen-ink/50">
                No prescription values were recorded.
              </p>
            )
          ) : (
            <div className="mt-6">
              <OpenFileButton
                id={p.id}
                getUrl={getAdminPrescriptionUrl}
                label="Open file (1-hour link)"
                className="rounded-md bg-lumen-blue px-4 py-2 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              />
              <p className="mt-2 text-xs text-lumen-ink/50">
                Opening generates a short-lived signed URL; every access is recorded in the
                audit log.
              </p>
            </div>
          )}
        </div>

        {/* Review panel */}
        <div className="rounded-lg border border-lumen-ink/10 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-lumen-ink/60">
            Status
          </h2>
          <div className="mb-4">
            <StatusBadge status={p.status} />
          </div>

          {p.review_notes && (
            <div className="mb-4">
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-lumen-ink/40">
                Review note
              </dt>
              <dd className="text-sm text-lumen-ink">{p.review_notes}</dd>
            </div>
          )}

          <form action={reviewPrescription} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={p.id} />
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-sm font-medium text-lumen-ink">
                Review note{" "}
                <span className="font-normal text-lumen-ink/50">
                  (shown to the customer if rejected)
                </span>
              </span>
              <textarea
                name="review_notes"
                rows={3}
                maxLength={500}
                defaultValue={p.review_notes ?? ""}
                placeholder="e.g. Image is blurry — please re-upload a clearer photo."
                className="min-h-20 resize-y rounded-md border border-lumen-ink/15 bg-white px-3 py-2 text-sm text-lumen-ink outline-none focus-visible:border-lumen-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lumen-blue"
              />
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                name="status"
                value="verified"
                className="w-full rounded-md border border-lumen-sage/30 bg-lumen-sage/8 px-3 py-2 text-sm font-medium text-lumen-sage transition-colors hover:bg-lumen-sage/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                Mark verified
              </button>
              <button
                type="submit"
                name="status"
                value="rejected"
                className="w-full rounded-md border border-lumen-warm/30 bg-lumen-warm/8 px-3 py-2 text-sm font-medium text-lumen-warm transition-colors hover:bg-lumen-warm/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                Reject
              </button>
            </div>
          </form>

          {p.status === "pending" && (
            <p className="mt-4 text-xs text-lumen-ink/50">
              Awaiting your review.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Alert kind="success">
          This document is health data — handled per the DPA: private storage, logged
          access, customer consent on file.
        </Alert>
      </div>
    </>
  );
}
