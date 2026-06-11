import { describe, it, expect } from "vitest";
import { appointmentSchema, APPOINTMENT_SERVICES } from "./appointment-schemas";

const VALID_BASE = {
  clinic_id: "11111111-1111-4111-8111-111111111111",
  clinic_name: "East Legon clinic",
  service: "eye-test" as const,
  name: "Kofi Mensah",
  phone: "0241234567",
  email: "kofi@example.com",
};

describe("appointmentSchema — valid inputs", () => {
  it("accepts a minimal valid request", () => {
    const result = appointmentSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it("normalises phone to E.164", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      phone: "0551234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toMatch(/^\+233/);
    }
  });

  it("accepts a +233 prefixed phone", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      phone: "+233241234567",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all service values", () => {
    for (const service of APPOINTMENT_SERVICES) {
      const result = appointmentSchema.safeParse({ ...VALID_BASE, service });
      expect(result.success).toBe(true);
    }
  });

  it("accepts a future preferred_date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const dateStr = future.toISOString().slice(0, 10);
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      preferred_date: dateStr,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferred_date).toBe(dateStr);
    }
  });

  it("treats empty preferred_date as undefined", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      preferred_date: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferred_date).toBeUndefined();
    }
  });

  it("treats empty notes as valid", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      notes: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("appointmentSchema — invalid inputs", () => {
  it("rejects a non-Ghana phone number", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      phone: "+447911123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a garbled phone number", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      phone: "not-a-phone",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      email: "notanemail",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown service", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      service: "laser-surgery",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a past preferred_date", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      preferred_date: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a badly formatted date", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      preferred_date: "tomorrow",
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 500 chars", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = appointmentSchema.safeParse({ ...VALID_BASE, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid clinic_id (not a uuid)", () => {
    const result = appointmentSchema.safeParse({
      ...VALID_BASE,
      clinic_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
