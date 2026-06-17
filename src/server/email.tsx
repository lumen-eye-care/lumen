/**
 * Server-only email render helpers. This file is .tsx so JSX works; it
 * imports `render` from @react-email/render and the branded template
 * components, then exports one typed async function per email type.
 * All callers are .ts server modules — they import these helpers and get
 * back { html, text } ready for resend.emails.send().
 */
import "server-only";
import { render, toPlainText } from "@react-email/render";
import { OrderConfirmedEmail, OrderShippedEmail } from "@/components/email/orders";
import {
  AppointmentReceivedEmail,
  AppointmentAlertEmail,
  AppointmentConfirmedEmail,
  AppointmentCancelledEmail,
  AppointmentCompletedEmail,
} from "@/components/email/appointments";
import {
  PrescriptionVerifiedEmail,
  PrescriptionRejectedEmail,
} from "@/components/email/prescriptions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lumeneye.org";

// v2 API: render() → HTML string; toPlainText() converts that HTML to plain text.
async function both(
  jsx: React.ReactElement,
): Promise<{ html: string; text: string }> {
  const h = await render(jsx);
  return { html: h, text: toPlainText(h) };
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function renderOrderConfirmedEmail(props: {
  name: string | null;
  reference: string;
  totalPesewa: number;
  method: string;
}) {
  return both(
    <OrderConfirmedEmail {...props} siteUrl={SITE_URL} />,
  );
}

export async function renderOrderShippedEmail(props: {
  name: string | null;
  reference: string;
  totalPesewa: number;
}) {
  return both(
    <OrderShippedEmail {...props} siteUrl={SITE_URL} />,
  );
}

// ── Appointments ─────────────────────────────────────────────────────────────

export async function renderAppointmentReceivedEmail(props: {
  name: string;
  serviceLabel: string;
  clinicName: string;
  preferredDate: string | null;
  whatsAppUrl: string;
}) {
  return both(<AppointmentReceivedEmail {...props} />);
}

export async function renderAppointmentAlertEmail(props: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceLabel: string;
  clinicName: string;
  preferredDate: string | null;
  notes: string | null;
  whatsAppChatLink: string;
  callLink: string;
  adminUrl: string;
}) {
  return both(<AppointmentAlertEmail {...props} />);
}

export async function renderAppointmentConfirmedEmail(props: {
  name: string;
  serviceLabel: string;
  clinicName: string;
  preferredDate: string | null;
}) {
  return both(<AppointmentConfirmedEmail {...props} />);
}

export async function renderAppointmentCancelledEmail(props: {
  name: string;
  serviceLabel: string;
  clinicName: string;
}) {
  return both(
    <AppointmentCancelledEmail {...props} bookUrl={`${SITE_URL}/book`} />,
  );
}

export async function renderAppointmentCompletedEmail(props: {
  name: string;
  serviceLabel: string;
  clinicName: string;
}) {
  return both(
    <AppointmentCompletedEmail {...props} shopUrl={`${SITE_URL}/shop`} />,
  );
}

// ── Prescriptions ─────────────────────────────────────────────────────────────

export async function renderPrescriptionVerifiedEmail(props: {
  name: string | null;
  reviewNotes: string | null;
}) {
  return both(
    <PrescriptionVerifiedEmail {...props} shopUrl={`${SITE_URL}/shop`} />,
  );
}

export async function renderPrescriptionRejectedEmail(props: {
  name: string | null;
  reviewNotes: string | null;
}) {
  return both(
    <PrescriptionRejectedEmail {...props} bookUrl={`${SITE_URL}/book`} />,
  );
}
