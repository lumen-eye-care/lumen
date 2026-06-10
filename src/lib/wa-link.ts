/**
 * Build a WhatsApp deep link from a stored E.164 number (wa.me wants the
 * number without the leading "+"), optionally with a prefilled message.
 */
export function waMeUrl(e164: string, text?: string): string {
  const digits = e164.replace(/\D/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
