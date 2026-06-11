"use server";

import { createClient } from "@/server/supabase";
import { appointmentSchema } from "@/lib/appointment-schemas";
import {
  createAppointment,
  sendAppointmentEmails,
} from "@/server/appointments";

export type BookFormState =
  | { status: "idle" }
  | { status: "success"; appointmentId: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function firstFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (msgs?.[0]) out[key] = msgs[0];
  }
  return out;
}

export async function requestAppointment(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const candidate = {
    clinic_id: str(formData, "clinic_id"),
    clinic_name: str(formData, "clinic_name"),
    service: str(formData, "service"),
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    preferred_date: str(formData, "preferred_date"),
    notes: str(formData, "notes"),
  };

  const parsed = appointmentSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Please correct the errors below.",
      fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  // Capture user_id if signed in — null for anonymous visitors.
  let userId: string | null = null;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch {
    // Non-fatal: anonymous submission is allowed.
  }

  const result = await createAppointment(parsed.data, userId);
  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  // Best-effort — never blocks success.
  await sendAppointmentEmails({
    appointment: parsed.data,
    appointmentId: result.id,
  });

  return { status: "success", appointmentId: result.id };
}
