import { describe, it, expect } from "vitest";
import { clinicSchema, type ClinicInput } from "@/lib/clinic-schemas";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const openDay = { open: "08:00", close: "19:00", closed: false };
const closedDay = { open: null, close: null, closed: true };

const valid = {
  name: "East Legon clinic",
  slug: "east-legon",
  address: "12 Lagos Avenue, East Legon, Accra",
  phone: "+233302700218",
  whatsapp: "0552138821",
  optometrist_count: 3,
  services: ["Eye tests", "Contact lens fitting"],
  opening_hours: {
    mon: openDay,
    tue: openDay,
    wed: openDay,
    thu: openDay,
    fri: { open: "08:00", close: "20:00", closed: false },
    sat: { open: "09:00", close: "18:00", closed: false },
    sun: closedDay,
  },
  is_flagship: true,
  latitude: 5.636,
  longitude: -0.163,
  sort_order: 0,
};

describe("clinicSchema", () => {
  it("accepts a valid clinic and normalises local phones to E.164", () => {
    const parsed = clinicSchema.parse(valid) as ClinicInput;
    expect(parsed.phone).toBe("+233302700218");
    expect(parsed.whatsapp).toBe("+233552138821");
  });

  it("turns empty phone/whatsapp into null", () => {
    const parsed = clinicSchema.parse({ ...valid, phone: "", whatsapp: "" });
    expect(parsed.phone).toBeNull();
    expect(parsed.whatsapp).toBeNull();
  });

  it("rejects a non-Ghana phone number", () => {
    expect(
      clinicSchema.safeParse({ ...valid, phone: "+442071234567" }).success,
    ).toBe(false);
  });

  it("rejects a bad slug", () => {
    expect(
      clinicSchema.safeParse({ ...valid, slug: "East Legon!" }).success,
    ).toBe(false);
  });

  it("rejects an open day with missing times", () => {
    const bad = {
      ...valid,
      opening_hours: {
        ...valid.opening_hours,
        mon: { open: "08:00", close: null, closed: false },
      },
    };
    expect(clinicSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects closing time before opening time", () => {
    const bad = {
      ...valid,
      opening_hours: {
        ...valid.opening_hours,
        mon: { open: "19:00", close: "08:00", closed: false },
      },
    };
    expect(clinicSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects malformed time strings", () => {
    const bad = {
      ...valid,
      opening_hours: {
        ...valid.opening_hours,
        mon: { open: "8am", close: "19:00", closed: false },
      },
    };
    expect(clinicSchema.safeParse(bad).success).toBe(false);
  });

  it("normalises stale times off a closed day", () => {
    const parsed = clinicSchema.parse({
      ...valid,
      opening_hours: {
        ...valid.opening_hours,
        sun: { open: "08:00", close: "19:00", closed: true },
      },
    });
    expect(parsed.opening_hours.sun).toEqual({
      open: null,
      close: null,
      closed: true,
    });
  });

  it("rejects out-of-range coordinates", () => {
    expect(clinicSchema.safeParse({ ...valid, latitude: 91 }).success).toBe(
      false,
    );
  });

  it("accepts null coordinates", () => {
    const parsed = clinicSchema.parse({
      ...valid,
      latitude: null,
      longitude: null,
    });
    expect(parsed.latitude).toBeNull();
  });
});
