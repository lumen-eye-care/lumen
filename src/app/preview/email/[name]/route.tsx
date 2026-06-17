import { render } from "@react-email/render";
import { NextResponse } from "next/server";
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

const SITE = "http://localhost:3000";

// Realistic sample data — Ghanaian names, real field values
const SAMPLE = {
  name: "Akosua Mensah",
  reference: "lumen_a1b2c3d4e5f6",
  totalPesewa: 49999, // GHS 499.99 (Om3ga frame)
  siteUrl: SITE,
  serviceLabel: "Eye Test",
  clinicName: "East Legon Clinic",
  preferredDate: "2026-07-10",
  reviewNotes: "Clear scan, all fields present. Issued within the last 12 months.",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { name } = await params;
  let jsx: React.ReactElement;

  switch (name) {
    case "order-confirmed-card":
      jsx = <OrderConfirmedEmail {...SAMPLE} method="card" />;
      break;
    case "order-confirmed-cod":
      jsx = <OrderConfirmedEmail {...SAMPLE} method="cod" />;
      break;
    case "order-shipped":
      jsx = <OrderShippedEmail {...SAMPLE} />;
      break;
    case "appointment-received":
      jsx = (
        <AppointmentReceivedEmail
          name={SAMPLE.name}
          serviceLabel={SAMPLE.serviceLabel}
          clinicName={SAMPLE.clinicName}
          preferredDate={SAMPLE.preferredDate}
          whatsAppUrl={`https://wa.me/233245628432?text=Hi+Lumen`}
        />
      );
      break;
    case "appointment-alert":
      jsx = (
        <AppointmentAlertEmail
          customerName={SAMPLE.name}
          customerPhone="+233244567890"
          customerEmail="akosua@example.com"
          serviceLabel={SAMPLE.serviceLabel}
          clinicName={SAMPLE.clinicName}
          preferredDate={SAMPLE.preferredDate}
          notes="Please book me in the morning if possible."
          whatsAppChatLink="https://wa.me/233244567890?text=Hi+Akosua"
          callLink="tel:+233244567890"
          adminUrl={`${SITE}/admin/appointments`}
        />
      );
      break;
    case "appointment-confirmed":
      jsx = (
        <AppointmentConfirmedEmail
          name={SAMPLE.name}
          serviceLabel={SAMPLE.serviceLabel}
          clinicName={SAMPLE.clinicName}
          preferredDate={SAMPLE.preferredDate}
        />
      );
      break;
    case "appointment-cancelled":
      jsx = (
        <AppointmentCancelledEmail
          name={SAMPLE.name}
          serviceLabel={SAMPLE.serviceLabel}
          clinicName={SAMPLE.clinicName}
          bookUrl={`${SITE}/book`}
        />
      );
      break;
    case "appointment-completed":
      jsx = (
        <AppointmentCompletedEmail
          name={SAMPLE.name}
          serviceLabel={SAMPLE.serviceLabel}
          clinicName={SAMPLE.clinicName}
          shopUrl={`${SITE}/shop`}
        />
      );
      break;
    case "prescription-verified":
      jsx = (
        <PrescriptionVerifiedEmail
          name={SAMPLE.name}
          reviewNotes={SAMPLE.reviewNotes}
          shopUrl={`${SITE}/shop`}
        />
      );
      break;
    case "prescription-rejected":
      jsx = (
        <PrescriptionRejectedEmail
          name={SAMPLE.name}
          reviewNotes="The image was too blurry to read the prescription values clearly. Please upload a clearer photo or scan."
          bookUrl={`${SITE}/book`}
        />
      );
      break;
    default:
      return new Response("Unknown template", { status: 404 });
  }

  const html = await render(jsx, { pretty: true });
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
