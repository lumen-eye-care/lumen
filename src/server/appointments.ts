import "server-only";
import { createClient } from "@/server/supabase";
import { requireUser } from "@/server/auth-guards";
import { getResend } from "@/server/resend";
import {
  renderAppointmentReceivedEmail,
  renderAppointmentAlertEmail,
  renderAppointmentConfirmedEmail,
  renderAppointmentCancelledEmail,
  renderAppointmentCompletedEmail,
} from "@/server/email";
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lumeneye.org";

  // Free second entry point: wa.me prefilled with booking summary so the
  // customer's tap also reaches the rep's WhatsApp with context.
  // See docs/whatsapp-free-loop.md.
  const customerWhatsApp = bookingWhatsAppUrl({
    name: appointment.name,
    serviceLabel,
    clinicName: appointment.clinic_name,
    preferredDate: appointment.preferred_date ?? null,
  });

  // The clinic rep is NOT an app user — they act from this notification email.
  // Include one-tap WhatsApp + tel: links built from the customer's E.164 phone.
  const chatLink = waMeUrl(
    appointment.phone,
    `Hi ${appointment.name}, this is ${appointment.clinic_name} about your ${serviceLabel.toLowerCase()} request with Lumen Eye Care.`,
  );
  const callLink = `tel:${appointment.phone.replace(/[^\d+]/g, "")}`;
  const notifyEmail = process.env.APPOINTMENTS_NOTIFY_EMAIL;

  try {
    const resend = getResend();
    const [customerBody, alertBody] = await Promise.all([
      renderAppointmentReceivedEmail({
        name: appointment.name,
        serviceLabel,
        clinicName: appointment.clinic_name,
        preferredDate: appointment.preferred_date ?? null,
        whatsAppUrl: customerWhatsApp,
      }),
      notifyEmail
        ? renderAppointmentAlertEmail({
            customerName: appointment.name,
            customerPhone: appointment.phone,
            customerEmail: appointment.email,
            serviceLabel,
            clinicName: appointment.clinic_name,
            preferredDate: appointment.preferred_date ?? null,
            notes: appointment.notes ?? null,
            whatsAppChatLink: chatLink,
            callLink,
            adminUrl: `${siteUrl}/admin/appointments`,
          })
        : null,
    ]);

    const sends: Promise<unknown>[] = [
      resend.emails.send({
        from: APPOINTMENTS_FROM,
        to: appointment.email,
        subject: `Your appointment request — ${appointment.clinic_name}`,
        html: customerBody.html,
        text: customerBody.text,
      }),
    ];
    if (notifyEmail && alertBody) {
      sends.push(
        resend.emails.send({
          from: APPOINTMENTS_FROM,
          to: notifyEmail,
          subject: `[Lumen] New appointment request — ${appointment.name}`,
          html: alertBody.html,
          text: alertBody.text,
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

/**
 * Best-effort customer email when an admin changes an appointment's status
 * (confirmed/cancelled/completed). Never throws — a Resend failure must never
 * block the status write in the admin action.
 */
export async function sendAppointmentStatusEmail(params: {
  appointment: Pick<
    AppointmentRow,
    "name" | "email" | "clinic_name" | "service" | "preferred_date"
  >;
  status: AppointmentStatus;
}): Promise<void> {
  const { appointment, status } = params;
  if (status === "requested") return; // no email when reverted to requested

  const serviceLabel =
    SERVICE_LABELS[appointment.service as AppointmentService] ?? appointment.service;

  try {
    let subject: string;
    let body: { html: string; text: string };

    if (status === "confirmed") {
      subject = `Your appointment is confirmed — ${appointment.clinic_name}`;
      body = await renderAppointmentConfirmedEmail({
        name: appointment.name,
        serviceLabel,
        clinicName: appointment.clinic_name,
        preferredDate: appointment.preferred_date,
      });
    } else if (status === "cancelled") {
      subject = `Your appointment was cancelled — ${appointment.clinic_name}`;
      body = await renderAppointmentCancelledEmail({
        name: appointment.name,
        serviceLabel,
        clinicName: appointment.clinic_name,
      });
    } else {
      // completed
      subject = `Thanks for visiting — ${appointment.clinic_name}`;
      body = await renderAppointmentCompletedEmail({
        name: appointment.name,
        serviceLabel,
        clinicName: appointment.clinic_name,
      });
    }

    await getResend().emails.send({
      from: APPOINTMENTS_FROM,
      to: appointment.email,
      subject,
      html: body.html,
      text: body.text,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Appointment status email failed (non-fatal)", err);
    }
  }
}
