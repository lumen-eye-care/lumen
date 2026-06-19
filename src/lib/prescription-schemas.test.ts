import { describe, it, expect } from "vitest";
import {
  prescriptionMetaSchema,
  manualRxSchema,
  toRxValues,
  validatePrescriptionFile,
  isStaleIssueDate,
  PRESCRIPTION_MAX_BYTES,
} from "./prescription-schemas";

function makeFile(type: string, size: number, name = "rx"): File {
  // Construct a File with a controlled byte length (jsdom Blob honours the parts).
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("validatePrescriptionFile", () => {
  it("accepts a JPEG within the size cap", () => {
    const result = validatePrescriptionFile(makeFile("image/jpeg", 1024, "rx.jpg"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mime).toBe("image/jpeg");
  });

  it("accepts a PDF", () => {
    expect(validatePrescriptionFile(makeFile("application/pdf", 2048)).ok).toBe(true);
  });

  it("accepts png and webp", () => {
    expect(validatePrescriptionFile(makeFile("image/png", 10)).ok).toBe(true);
    expect(validatePrescriptionFile(makeFile("image/webp", 10)).ok).toBe(true);
  });

  it("rejects a missing file", () => {
    expect(validatePrescriptionFile(null).ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validatePrescriptionFile(makeFile("image/jpeg", 0)).ok).toBe(false);
  });

  it("rejects a disallowed mime type", () => {
    const result = validatePrescriptionFile(makeFile("image/gif", 100));
    expect(result.ok).toBe(false);
  });

  it("rejects a file over the 5 MB cap", () => {
    const result = validatePrescriptionFile(
      makeFile("image/jpeg", PRESCRIPTION_MAX_BYTES + 1),
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a file exactly at the cap", () => {
    expect(
      validatePrescriptionFile(makeFile("image/png", PRESCRIPTION_MAX_BYTES)).ok,
    ).toBe(true);
  });
});

describe("prescriptionMetaSchema", () => {
  it("accepts minimal valid metadata with consent", () => {
    const result = prescriptionMetaSchema.safeParse({ consent: true });
    expect(result.success).toBe(true);
  });

  it("rejects without consent", () => {
    expect(prescriptionMetaSchema.safeParse({ consent: false }).success).toBe(false);
    expect(prescriptionMetaSchema.safeParse({}).success).toBe(false);
  });

  it("accepts optional practitioner, notes, and a past issue date", () => {
    const result = prescriptionMetaSchema.safeParse({
      consent: true,
      practitioner_name: "Dr. Ama Owusu",
      issued_on: "2025-01-15",
      notes: "Right eye stronger.",
    });
    expect(result.success).toBe(true);
  });

  it("treats empty optional strings as allowed", () => {
    const result = prescriptionMetaSchema.safeParse({
      consent: true,
      practitioner_name: "",
      issued_on: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a future issue date", () => {
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    const iso = next.toISOString().slice(0, 10);
    expect(
      prescriptionMetaSchema.safeParse({ consent: true, issued_on: iso }).success,
    ).toBe(false);
  });

  it("rejects a malformed issue date", () => {
    expect(
      prescriptionMetaSchema.safeParse({ consent: true, issued_on: "15-01-2025" })
        .success,
    ).toBe(false);
  });

  it("rejects over-long notes", () => {
    expect(
      prescriptionMetaSchema.safeParse({ consent: true, notes: "x".repeat(501) })
        .success,
    ).toBe(false);
  });
});

describe("manualRxSchema", () => {
  const base = {
    right: { sph: "-1.25" },
    left: { sph: "0" },
    consent: true,
  };

  it("accepts minimal valid input (SPH only, both eyes) with consent", () => {
    const result = manualRxSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects without consent", () => {
    expect(manualRxSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });

  it("requires SPH on each eye", () => {
    expect(
      manualRxSchema.safeParse({ right: { sph: "" }, left: { sph: "0" }, consent: true })
        .success,
    ).toBe(false);
  });

  it("rejects SPH out of range", () => {
    expect(
      manualRxSchema.safeParse({ ...base, right: { sph: "25" } }).success,
    ).toBe(false);
  });

  it("rejects a dioptre value off the 0.25 step", () => {
    expect(
      manualRxSchema.safeParse({ ...base, right: { sph: "-1.30" } }).success,
    ).toBe(false);
  });

  it("requires AXIS when CYL is given (and vice-versa)", () => {
    expect(
      manualRxSchema.safeParse({ ...base, right: { sph: "-1.00", cyl: "-0.75" } }).success,
    ).toBe(false);
    expect(
      manualRxSchema.safeParse({ ...base, right: { sph: "-1.00", axis: "90" } }).success,
    ).toBe(false);
    expect(
      manualRxSchema.safeParse({
        ...base,
        right: { sph: "-1.00", cyl: "-0.75", axis: "90" },
      }).success,
    ).toBe(true);
  });

  it("rejects an out-of-range or non-integer axis", () => {
    expect(
      manualRxSchema.safeParse({
        ...base,
        right: { sph: "-1.00", cyl: "-0.75", axis: "181" },
      }).success,
    ).toBe(false);
    expect(
      manualRxSchema.safeParse({
        ...base,
        right: { sph: "-1.00", cyl: "-0.75", axis: "90.5" },
      }).success,
    ).toBe(false);
  });

  it("validates PD range + step", () => {
    expect(manualRxSchema.safeParse({ ...base, pd: "63" }).success).toBe(true);
    expect(manualRxSchema.safeParse({ ...base, pd: "62.5" }).success).toBe(true);
    expect(manualRxSchema.safeParse({ ...base, pd: "39" }).success).toBe(false);
    expect(manualRxSchema.safeParse({ ...base, pd: "62.3" }).success).toBe(false);
  });

  it("toRxValues normalises omitted fields to null", () => {
    const parsed = manualRxSchema.safeParse({
      right: { sph: "-1.25", cyl: "-0.50", axis: "180", add: "1.00" },
      left: { sph: "0" },
      pd: "63",
      consent: true,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const rx = toRxValues(parsed.data);
    expect(rx.right).toEqual({ sph: -1.25, cyl: -0.5, axis: 180, add: 1 });
    expect(rx.left).toEqual({ sph: 0, cyl: null, axis: null, add: null });
    expect(rx.pd).toBe(63);
  });
});

describe("isStaleIssueDate", () => {
  const now = new Date("2026-06-15T00:00:00Z");

  it("is false for a recent date", () => {
    expect(isStaleIssueDate("2026-01-01", now)).toBe(false);
  });

  it("is true for a date over 12 months old", () => {
    expect(isStaleIssueDate("2025-01-01", now)).toBe(true);
  });

  it("is false for null/empty/invalid", () => {
    expect(isStaleIssueDate(null, now)).toBe(false);
    expect(isStaleIssueDate(undefined, now)).toBe(false);
    expect(isStaleIssueDate("not-a-date", now)).toBe(false);
  });
});
