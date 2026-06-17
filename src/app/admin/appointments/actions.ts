"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import {
  getAppointment,
  updateAppointmentStatus,
  sendAppointmentStatusEmail,
} from "@/server/appointments";
import { APPOINTMENT_STATUSES } from "@/lib/appointment-schemas";

export async function setAppointmentStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || !id) return;
  if (typeof status !== "string" || !(APPOINTMENT_STATUSES as readonly string[]).includes(status)) return;

  const next = status as (typeof APPOINTMENT_STATUSES)[number];
  const appt = await getAppointment(id);
  const { ok } = await updateAppointmentStatus(id, next);

  // Notify the customer of the new status (best-effort, never blocks the write).
  if (ok && appt) {
    await sendAppointmentStatusEmail({ appointment: appt, status: next });
  }

  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
}
