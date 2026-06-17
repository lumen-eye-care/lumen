import { Hr, Link, Section, Text } from "@react-email/components";
import { LumenEmailLayout, emailStyles } from "./layout";

// ── Appointment Received (customer) ─────────────────────────────────────────

interface AppointmentReceivedEmailProps {
  name: string;
  serviceLabel: string;
  clinicName: string;
  preferredDate: string | null;
  whatsAppUrl: string;
}

export function AppointmentReceivedEmail({
  name,
  serviceLabel,
  clinicName,
  preferredDate,
  whatsAppUrl,
}: AppointmentReceivedEmailProps) {
  return (
    <LumenEmailLayout
      preview={`Appointment request received — ${serviceLabel} at ${clinicName}`}
    >
      <Text style={emailStyles.h1}>We&apos;ve received your request</Text>
      <Text style={emailStyles.body}>
        Hi {name}, thank you for booking with Lumen Eye Care. Our team will be in touch
        shortly to confirm your appointment.
      </Text>

      <Hr style={emailStyles.divider} />

      <Section>
        <Text style={emailStyles.label}>Service</Text>
        <Text style={emailStyles.value}>{serviceLabel}</Text>

        <Text style={emailStyles.label}>Clinic</Text>
        <Text style={emailStyles.value}>{clinicName}</Text>

        {preferredDate && (
          <>
            <Text style={emailStyles.label}>Preferred date</Text>
            <Text style={emailStyles.value}>{preferredDate}</Text>
          </>
        )}
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.body}>
        Want a quicker response? Message us directly on WhatsApp — it&apos;s free and we
        typically reply within the hour.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={whatsAppUrl} style={emailStyles.button}>
          Message us on WhatsApp
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        You can manage your appointments in your{" "}
        <Link href="https://www.lumeneye.org/account/appointments" style={{ color: "#0F4C81" }}>
          Lumen account
        </Link>
        .
      </Text>
    </LumenEmailLayout>
  );
}

// ── Appointment Alert (rep / ops inbox) ─────────────────────────────────────

interface AppointmentAlertEmailProps {
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
}

export function AppointmentAlertEmail({
  customerName,
  customerPhone,
  customerEmail,
  serviceLabel,
  clinicName,
  preferredDate,
  notes,
  whatsAppChatLink,
  callLink,
  adminUrl,
}: AppointmentAlertEmailProps) {
  return (
    <LumenEmailLayout
      preview={`New booking — ${customerName} · ${serviceLabel} at ${clinicName}`}
    >
      <Text style={emailStyles.h1}>New appointment request</Text>

      <Hr style={emailStyles.divider} />

      <Section>
        <Text style={emailStyles.label}>Customer</Text>
        <Text style={emailStyles.value}>{customerName}</Text>

        <Text style={emailStyles.label}>Phone</Text>
        <Text style={emailStyles.value}>{customerPhone}</Text>

        <Text style={emailStyles.label}>Email</Text>
        <Text style={emailStyles.value}>{customerEmail}</Text>

        <Text style={emailStyles.label}>Service</Text>
        <Text style={emailStyles.value}>{serviceLabel}</Text>

        <Text style={emailStyles.label}>Clinic</Text>
        <Text style={emailStyles.value}>{clinicName}</Text>

        {preferredDate && (
          <>
            <Text style={emailStyles.label}>Preferred date</Text>
            <Text style={emailStyles.value}>{preferredDate}</Text>
          </>
        )}

        {notes && (
          <>
            <Text style={emailStyles.label}>Notes from customer</Text>
            <Text style={emailStyles.value}>{notes}</Text>
          </>
        )}
      </Section>

      <Hr style={emailStyles.divider} />

      <Section>
        <Text style={{ ...emailStyles.body, marginBottom: "12px" }}>
          Respond to the customer:
        </Text>
        <Link href={whatsAppChatLink} style={{ ...emailStyles.button, marginRight: "12px" }}>
          WhatsApp
        </Link>
        {"  "}
        <Link href={callLink} style={emailStyles.ghostButton}>
          Call
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Section style={{ paddingTop: "4px" }}>
        <Link href={adminUrl} style={emailStyles.muted}>
          Manage in admin →
        </Link>
      </Section>
    </LumenEmailLayout>
  );
}

// ── Appointment Confirmed (customer) ─────────────────────────────────────────

interface AppointmentConfirmedEmailProps {
  name: string;
  serviceLabel: string;
  clinicName: string;
  preferredDate: string | null;
}

export function AppointmentConfirmedEmail({
  name,
  serviceLabel,
  clinicName,
  preferredDate,
}: AppointmentConfirmedEmailProps) {
  const dateLine = preferredDate ? ` on ${preferredDate}` : "";

  return (
    <LumenEmailLayout
      preview={`Your appointment is confirmed — ${serviceLabel} at ${clinicName}`}
    >
      <Text style={emailStyles.h1}>Your appointment is confirmed</Text>
      <Text style={emailStyles.body}>
        Hi {name}, your {serviceLabel.toLowerCase()} at {clinicName}
        {dateLine} is confirmed. We look forward to seeing you.
      </Text>

      <Hr style={emailStyles.divider} />

      <Section>
        <Text style={emailStyles.label}>Service</Text>
        <Text style={emailStyles.value}>{serviceLabel}</Text>

        <Text style={emailStyles.label}>Clinic</Text>
        <Text style={emailStyles.value}>{clinicName}</Text>

        {preferredDate && (
          <>
            <Text style={emailStyles.label}>Date</Text>
            <Text style={emailStyles.value}>{preferredDate}</Text>
          </>
        )}
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        Need to change anything? Reply to this email or contact the clinic directly.
      </Text>
    </LumenEmailLayout>
  );
}

// ── Appointment Cancelled (customer) ─────────────────────────────────────────

interface AppointmentCancelledEmailProps {
  name: string;
  serviceLabel: string;
  clinicName: string;
  bookUrl: string;
}

export function AppointmentCancelledEmail({
  name,
  serviceLabel,
  clinicName,
  bookUrl,
}: AppointmentCancelledEmailProps) {
  return (
    <LumenEmailLayout
      preview={`Your appointment has been cancelled — ${clinicName}`}
    >
      <Text style={emailStyles.h1}>Appointment cancelled</Text>
      <Text style={emailStyles.body}>
        Hi {name}, your {serviceLabel.toLowerCase()} request at {clinicName} has been
        cancelled.
      </Text>
      <Text style={emailStyles.body}>
        If this wasn&apos;t expected, or if you&apos;d like to rebook, you can submit a new
        request any time.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={bookUrl} style={emailStyles.button}>
          Book again
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        Questions? Reply to this email and we&apos;ll sort it out.
      </Text>
    </LumenEmailLayout>
  );
}

// ── Appointment Completed (customer) ─────────────────────────────────────────

interface AppointmentCompletedEmailProps {
  name: string;
  serviceLabel: string;
  clinicName: string;
  shopUrl: string;
}

export function AppointmentCompletedEmail({
  name,
  serviceLabel,
  clinicName,
  shopUrl,
}: AppointmentCompletedEmailProps) {
  return (
    <LumenEmailLayout
      preview={`Thank you for visiting — ${clinicName}`}
    >
      <Text style={emailStyles.h1}>Thank you for visiting</Text>
      <Text style={emailStyles.body}>
        Hi {name}, thank you for your {serviceLabel.toLowerCase()} at {clinicName}.
        We hope it went well.
      </Text>
      <Text style={emailStyles.body}>
        Ready for your frames? Browse the Lumen collection and find your perfect pair.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={shopUrl} style={emailStyles.button}>
          Browse frames
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        Have feedback about your visit? Just reply to this email — we read every message.
      </Text>
    </LumenEmailLayout>
  );
}
