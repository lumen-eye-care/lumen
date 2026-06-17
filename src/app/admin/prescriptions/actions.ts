"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import {
  getPrescription,
  getPrescriptionSignedUrl,
  setPrescriptionStatus,
  sendPrescriptionStatusEmail,
} from "@/server/prescriptions";
import { PRESCRIPTION_STATUSES } from "@/lib/prescription-schemas";

/** Admin: verify or reject a prescription with an optional review note. */
export async function reviewPrescription(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const status = formData.get("status");
  const noteRaw = formData.get("review_notes");
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";

  if (typeof id !== "string" || !id) return;
  if (
    typeof status !== "string" ||
    !(PRESCRIPTION_STATUSES as readonly string[]).includes(status)
  ) {
    return;
  }

  // Fetch customer info before status write so we have email + name for the notification.
  const prescription = await getPrescription(id);

  const result = await setPrescriptionStatus(
    id,
    status as (typeof PRESCRIPTION_STATUSES)[number],
    note || null,
  );

  // Best-effort email — only fires on success, never blocks the action.
  if (result.ok && prescription) {
    await sendPrescriptionStatusEmail({
      customerEmail: prescription.customer_email,
      customerName: prescription.customer_name,
      status: status as (typeof PRESCRIPTION_STATUSES)[number],
      reviewNotes: note || null,
    });
  }

  revalidatePath("/admin/prescriptions");
  revalidatePath(`/admin/prescriptions/${id}`);
}

/** Admin: mint a logged 1-hour signed URL; the client opens it in a new tab. */
export async function getAdminPrescriptionUrl(
  id: string,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  if (!id) return { error: "Missing prescription." };
  const url = await getPrescriptionSignedUrl(id, "admin-review");
  return url ? { url } : { error: "Could not open the file." };
}
