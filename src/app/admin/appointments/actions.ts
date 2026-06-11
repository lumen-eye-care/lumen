"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import { updateAppointmentStatus } from "@/server/appointments";
import { APPOINTMENT_STATUSES } from "@/lib/appointment-schemas";

export async function setAppointmentStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || !id) return;
  if (typeof status !== "string" || !(APPOINTMENT_STATUSES as readonly string[]).includes(status)) return;

  await updateAppointmentStatus(id, status as (typeof APPOINTMENT_STATUSES)[number]);
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
}
