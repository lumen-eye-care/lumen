import "server-only";
import { createClient } from "@/server/supabase";
import { requireUser } from "@/server/auth-guards";
import { getResend } from "@/server/resend";
import { waMeUrl } from "@/lib/wa-link";
import { bookingWhatsAppUrl } from "@/lib/contact";
import type {
  AppointmentInput,
  AppointmentService,
  AppointmentStatus,
} from "@/lib/appointment-schemas";
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

export type OwnAppointmentRow = {
  id: string;
  clinic_name: string;
  service: string;
  preferred_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

/**
 * Customer: the signed-in user's own appointment requests, newest first.
 * Filters on `user_id` explicitly — the `appointments admin all` RLS policy would
 * otherwise surface every row to an admin viewing their own account page (see
 * [[rls-admin-all-policy-needs-explicit-owner-filter]]). Mirrors
 * listOwnPrescriptions() in src/server/prescriptions.ts.
 */
export async function listOwnAppointments(): Promise<OwnAppointmentRow[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, clinic_name, service, preferred_date, notes, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[appointments] listOwnAppointments error", error.message);
    return [];
  }

  return (data ?? []) as OwnAppointmentRow[];
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

  // Free second entry point: a wa.me click-to-chat the customer can tap to open
  // the 24-hour customer-service window (no per-message cost). The prefill carries
  // the full booking summary, so it also reaches the rep's WhatsApp inbox with
  // complete context. See docs/whatsapp-free-loop.md.
  const customerWhatsApp = bookingWhatsAppUrl({
    name: appointment.name,
    serviceLabel,
    clinicName: appointment.clinic_name,
    preferredDate: appointment.preferred_date ?? null,
  });

  const customerText =
    `Hi ${appointment.name},\n\n` +
    `We've received your appointment request at ${appointment.clinic_name}.\n` +
    `Service: ${serviceLabel}${dateLine}\n\n` +
    `Our team will be in touch shortly to confirm your appointment.\n\n` +
    `Prefer WhatsApp? Message us for quicker updates: ${customerWhatsApp}\n\n` +
    `Thank you,\nThe Lumen Eye Care team`;

  // The clinic rep is NOT an app user — they act straight from this notification,
  // so include one-tap contact links built from the customer's (E.164) phone:
  // a wa.me click-to-chat and a tel: dial link. (v1 stand-in for automated
  // WhatsApp; the Cloud-API push is a deferred Phase 2 story.)
  const chatLink = waMeUrl(
    appointment.phone,
    `Hi ${appointment.name}, this is ${appointment.clinic_name} about your ${serviceLabel.toLowerCase()} request with Lumen Eye Care.`,
  );
  const callLink = `tel:${appointment.phone.replace(/[^\d+]/g, "")}`;

  const adminText =
    `New appointment request\n\n` +
    `Name: ${appointment.name}\n` +
    `Phone: ${appointment.phone}\n` +
    `Email: ${appointment.email}\n` +
    `Clinic: ${appointment.clinic_name}\n` +
    `Service: ${serviceLabel}${dateLine}\n` +
    (appointment.notes ? `\nNotes: ${appointment.notes}\n` : "") +
    `\nReply on WhatsApp: ${chatLink}\n` +
    `Call: ${callLink}\n` +
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

/** Per-status customer copy for a status change. `null` = no email for that status. */
function statusEmailBody(
  appt: Pick<AppointmentRow, "name" | "clinic_name" | "service" | "preferred_date">,
  status: AppointmentStatus,
): { subject: string; text: string } | null {
  const serviceLabel =
    SERVICE_LABELS[appt.service as AppointmentService] ?? appt.service;
  const dateLine = appt.preferred_date ? ` on ${appt.preferred_date}` : "";
  const sign = `\n\nThank you,\nThe Lumen Eye Care team`;

  switch (status) {
    case "confirmed":
      return {
        subject: `Your appointment is confirmed — ${appt.clinic_name}`,
        text:
          `Hi ${appt.name},\n\n` +
          `Good news — your ${serviceLabel.toLowerCase()} at ${appt.clinic_name}${dateLine} is confirmed.\n` +
          `If you need to change anything, just reply to this email or contact the clinic.${sign}`,
      };
    case "cancelled":
      return {
        subject: `Your appointment was cancelled — ${appt.clinic_name}`,
        text:
          `Hi ${appt.name},\n\n` +
          `Your ${serviceLabel.toLowerCase()} request at ${appt.clinic_name} has been cancelled.\n` +
          `If this wasn't expected, you can book again any time: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/book${sign}`,
      };
    case "completed":
      return {
        subject: `Thanks for visiting — ${appt.clinic_name}`,
        text:
          `Hi ${appt.name},\n\n` +
          `Thank you for your ${serviceLabel.toLowerCase()} at ${appt.clinic_name}. We hope it went well.\n` +
          `Ready for frames? Browse the collection: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/shop${sign}`,
      };
    case "requested":
      // No email when an admin moves something back to "requested".
      return null;
  }
}

/**
 * Best-effort customer email when an admin changes an appointment's status
 * (confirmed/cancelled/completed). Mirrors sendAppointmentEmails: never throws,
 * no-ops cleanly while RESEND_API_KEY is unset — so a Resend failure can never
 * block the status write in the admin action.
 */
export async function sendAppointmentStatusEmail(params: {
  appointment: Pick<
    AppointmentRow,
    "name" | "email" | "clinic_name" | "service" | "preferred_date"
  >;
  status: AppointmentStatus;
}): Promise<void> {
  const body = statusEmailBody(params.appointment, params.status);
  if (!body) return;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: APPOINTMENTS_FROM,
      to: params.appointment.email,
      subject: body.subject,
      text: body.text,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Appointment status email failed (non-fatal)", err);
    }
  }
}
