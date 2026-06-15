import { describe, it, expect } from "vitest";
import {
  prescriptionMetaSchema,
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
