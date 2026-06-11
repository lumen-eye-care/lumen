import "server-only";
import { createClient } from "@/server/supabase";
import { getResend } from "@/server/resend";
import type { AppointmentInput, AppointmentStatus } from "@/lib/appointment-schemas";
import { SERVICE_LABELS } from "@/lib/appointment-schemas";

const APPOINTMENTS_FROM = "Lumen Eye Care <orders@lumeneye.org>";

export type CreateAppointmentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Insert a new appointment request via the RLS-gated publishable-key client.
 * Mirrors the env-guard pattern from src/server/clinics.ts so the /book page
 * renders its error state cleanly without Supabase env vars.
 */
export async function createAppointment(
  input: AppointmentInput,
  userId: string | null,
): Promise<CreateAppointmentResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { ok: false, error: "Service temporarily unavailable." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: userId,
      clinic_id: input.clinic_id,
      clinic_name: input.clinic_name,
      service: input.service,
      name: input.name,
      phone: input.phone,
      email: input.email,
      preferred_date: input.preferred_date ?? null,
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[appointments] createAppointment error", error?.message);
    return { ok: false, error: "Could not submit your request. Please try again." };
  }

  return { ok: true, id: data.id };
}

export type AppointmentRow = {
  id: string;
  clinic_name: string;
  service: string;
  name: string;
  phone: string;
  email: string;
  preferred_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

/** Admin: list all appointment requests, newest first. */
export async function listAppointments(): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, clinic_name, service, name, phone, email, preferred_date, notes, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[appointments] listAppointments error", error.message);
    return [];
  }

  return (data ?? []) as AppointmentRow[];
}

/** Admin: single appointment detail. */
export async function getAppointment(id: string): Promise<AppointmentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, clinic_name, service, name, phone, email, preferred_date, notes, status, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[appointments] getAppointment error", error.message);
    return null;
  }

  return data as AppointmentRow | null;
}

/** Admin: update appointment status. */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[appointments] updateAppointmentStatus error", error.message);
    return { ok: false };
  }

  return { ok: true };
}

/**
 * Best-effort confirmation emails — mirrors sendOrderConfirmationEmail in
 * src/server/checkout.ts: never throws, no-ops cleanly while RESEND_API_KEY
 * is unset (Resend domain still pending verification per PROGRESS.md).
 */
export async function sendAppointmentEmails(params: {
  appointment: AppointmentInput;
  appointmentId: string;
}): Promise<void> {
  const { appointment } = params;
  const serviceLabel = SERVICE_LABELS[appointment.service] ?? appointment.service;
  const dateLine = appointment.preferred_date
    ? `\nPreferred date: ${appointment.preferred_date}`
    : "";

  const customerText =
    `Hi ${appointment.name},\n\n` +
    `We've received your appointment request at ${appointment.clinic_name}.\n` +
    `Service: ${serviceLabel}${dateLine}\n\n` +
    `Our team will be in touch shortly to confirm your appointment.\n\n` +
    `Thank you,\nThe Lumen Eye Care team`;

  const adminText =
    `New appointment request\n\n` +
    `Name: ${appointment.name}\n` +
    `Phone: ${appointment.phone}\n` +
    `Email: ${appointment.email}\n` +
    `Clinic: ${appointment.clinic_name}\n` +
    `Service: ${serviceLabel}${dateLine}\n` +
    (appointment.notes ? `\nNotes: ${appointment.notes}\n` : "") +
    `\nManage: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/appointments`;

  const notifyEmail = process.env.APPOINTMENTS_NOTIFY_EMAIL;

  try {
    const resend = getResend();
    const sends: Promise<unknown>[] = [
      resend.emails.send({
        from: APPOINTMENTS_FROM,
        to: appointment.email,
        subject: `Your appointment request — ${appointment.clinic_name}`,
        text: customerText,
      }),
    ];
    if (notifyEmail) {
      sends.push(
        resend.emails.send({
          from: APPOINTMENTS_FROM,
          to: notifyEmail,
          subject: `[Lumen] New appointment request — ${appointment.name}`,
          text: adminText,
        }),
      );
    }
    await Promise.allSettled(sends);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Appointment emails failed (non-fatal)", err);
    }
  }
}
