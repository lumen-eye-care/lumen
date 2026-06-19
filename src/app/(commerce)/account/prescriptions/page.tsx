import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth-guards";
import {
  listOwnPrescriptions,
  prescriptionUploadEnabled,
} from "@/server/prescriptions";
import { isStaleIssueDate } from "@/lib/prescription-schemas";
import { EmptyState } from "@/components/atoms/empty-state";
import { PrescriptionStatusPill } from "@/components/account/prescription-status-pill";
import { OpenFileButton } from "@/components/prescriptions/open-file-button";
import { PrescriptionForm } from "./prescription-form";
import { getOwnPrescriptionUrl } from "./actions";

export const metadata: Metadata = {
  title: "My prescriptions",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" });

export default async function PrescriptionsPage() {
  // Flag-gated: when off, the route does not exist (nav item is hidden too).
  if (!prescriptionUploadEnabled()) notFound();
  await requireUser();

  const prescriptions = await listOwnPrescriptions();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          My prescriptions
        </h1>
        <p className="max-w-xl text-sm" style={{ color: "var(--lm-muted)" }}>
          Already have a prescription from an eye-care practitioner? Upload a photo or PDF
          and our team will review it. We&apos;ll never share it — it stays private to your
          account.
        </p>
      </header>

      <PrescriptionForm />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--lm-muted)" }}>
          Uploaded prescriptions
        </h2>

        {prescriptions.length === 0 ? (
          <EmptyState
            icon="eye"
            title="No prescriptions yet"
            description="Upload one above, or book an eye test if you need a new prescription."
            cta={{ label: "Book an eye test", href: "/book" }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {prescriptions.map((p) => {
              const stale = isStaleIssueDate(p.issued_on);
              return (
                <li key={p.id} className="lm-card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="truncate font-medium" style={{ color: "var(--lm-text)" }}>
                      {p.original_name ?? "Prescription"}
                    </span>
                    <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
                      Uploaded {dateFmt.format(new Date(p.created_at))}
                      {p.issued_on ? ` · issued ${p.issued_on}` : ""}
                      {stale ? " (over a year old)" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <PrescriptionStatusPill status={p.status} />
                    </div>
                    {p.status === "rejected" && p.review_notes && (
                      <p className="mt-1 text-sm" style={{ color: "var(--lm-warm-text)" }}>
                        {p.review_notes}
                      </p>
                    )}
                  </div>
                  <OpenFileButton
                    id={p.id}
                    getUrl={getOwnPrescriptionUrl}
                    label="View"
                    className="lm-ghost px-4 py-2 text-sm"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
