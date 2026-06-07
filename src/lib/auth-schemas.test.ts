import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  resetRequestSchema,
  newPasswordSchema,
  PASSWORD_MIN,
} from "@/lib/auth-schemas";

describe("signUpSchema", () => {
  it("accepts a valid sign-up", () => {
    const r = signUpSchema.safeParse({
      name: "Ama Mensah",
      email: "Ama@Example.com",
      password: "supersecret",
    });
    expect(r.success).toBe(true);
    // email is normalised to lowercase
    if (r.success) expect(r.data.email).toBe("ama@example.com");
  });

  it("rejects passwords below the minimum length", () => {
    const r = signUpSchema.safeParse({
      name: "Ama",
      email: "ama@example.com",
      password: "x".repeat(PASSWORD_MIN - 1),
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const r = signUpSchema.safeParse({
      name: "   ",
      email: "ama@example.com",
      password: "supersecret",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const r = signUpSchema.safeParse({
      name: "Ama",
      email: "not-an-email",
      password: "supersecret",
    });
    expect(r.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password (no length rule on sign-in)", () => {
    const r = signInSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(r.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const r = signInSchema.safeParse({ email: "a@b.com", password: "" });
    expect(r.success).toBe(false);
  });
});

describe("resetRequestSchema", () => {
  it("accepts a valid email", () => {
    expect(resetRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(
      true,
    );
  });
});

describe("newPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const r = newPasswordSchema.safeParse({
      password: "supersecret",
      confirm: "supersecret",
    });
    expect(r.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const r = newPasswordSchema.safeParse({
      password: "supersecret",
      confirm: "different",
    });
    expect(r.success).toBe(false);
  });
});
