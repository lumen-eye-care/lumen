import { waMeUrl } from "@/lib/wa-link";

/**
 * Lumen's customer-facing WhatsApp line (E.164). Single source of truth — pairs
 * with waMeUrl() for click-to-chat deep links. A customer messaging this number
 * opens the free 24-hour customer-service window (no per-message cost) and lands
 * directly in the staffed WhatsApp Business inbox. See docs/whatsapp-free-loop.md.
 */
export const LUMEN_WHATSAPP_E164 = "+233245628432";

export type BookingWhatsAppContext = {
  name: string;
  serviceLabel: string;
  clinicName: string;
  /** YYYY-MM-DD, optional. */
  preferredDate?: string | null;
};

/**
 * Prefilled WhatsApp message for a customer who just booked an appointment.
 * Carries the full booking summary so it doubles as the rep's alert when it
 * lands in Lumen's WhatsApp Business inbox.
 */
export function buildBookingWhatsAppText(ctx: BookingWhatsAppContext): string {
  const date = ctx.preferredDate ? `, preferred date ${ctx.preferredDate}` : "";
  return (
    `Hi Lumen! I just booked: ${ctx.serviceLabel} at ${ctx.clinicName}${date}. ` +
    `My name is ${ctx.name}. I'd like to get updates on WhatsApp.`
  );
}

/** Full wa.me URL to message Lumen with a prefilled booking summary. */
export function bookingWhatsAppUrl(ctx: BookingWhatsAppContext): string {
  return waMeUrl(LUMEN_WHATSAPP_E164, buildBookingWhatsAppText(ctx));
}
