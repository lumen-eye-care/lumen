import { describe, it, expect } from "vitest";
import {
  LUMEN_WHATSAPP_E164,
  buildBookingWhatsAppText,
  bookingWhatsAppUrl,
} from "@/lib/contact";

describe("buildBookingWhatsAppText", () => {
  it("includes name, service, and clinic", () => {
    const text = buildBookingWhatsAppText({
      name: "Ama Owusu",
      serviceLabel: "Eye test",
      clinicName: "Lumen East Legon",
    });
    expect(text).toContain("Eye test at Lumen East Legon");
    expect(text).toContain("My name is Ama Owusu");
    expect(text).not.toContain("preferred date");
  });

  it("appends the preferred date when present", () => {
    const text = buildBookingWhatsAppText({
      name: "Kofi",
      serviceLabel: "Home visit eye test",
      clinicName: "Lumen Osu",
      preferredDate: "2026-07-10",
    });
    expect(text).toContain("preferred date 2026-07-10");
  });
});

describe("bookingWhatsAppUrl", () => {
  it("builds a wa.me link to the Lumen number with the encoded prefill", () => {
    const url = bookingWhatsAppUrl({
      name: "Ama",
      serviceLabel: "Eye test",
      clinicName: "Lumen Osu",
    });
    expect(url.startsWith("https://wa.me/233245628432?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1])).toBe(
      buildBookingWhatsAppText({
        name: "Ama",
        serviceLabel: "Eye test",
        clinicName: "Lumen Osu",
      }),
    );
  });

  it("keeps the canonical E.164 number", () => {
    expect(LUMEN_WHATSAPP_E164).toBe("+233245628432");
  });
});
