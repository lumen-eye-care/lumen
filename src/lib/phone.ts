import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Normalise a Ghana phone number (accepts 0XXXXXXXXX or +233XXXXXXXXX) to E.164.
 * Returns null when the input is not a valid Ghana number.
 */
export function normalizeGhanaPhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input, "GH");
  if (!parsed || !parsed.isValid() || parsed.country !== "GH") return null;
  return parsed.number; // E.164, e.g. +233241234567
}

export function isValidGhanaPhone(input: string): boolean {
  return normalizeGhanaPhone(input) !== null;
}
