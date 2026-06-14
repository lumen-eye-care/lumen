import { describe, it, expect } from "vitest";
import { profileSchema } from "./account-schemas";

describe("profileSchema — valid inputs", () => {
  it("accepts a name with a local Ghana phone", () => {
    const result = profileSchema.safeParse({
      name: "Ama Owusu",
      phone: "0241234567",
    });
    expect(result.success).toBe(true);
  });

  it("normalises a local 0XX phone to E.164 (+233)", () => {
    const result = profileSchema.safeParse({
      name: "Ama Owusu",
      phone: "0241234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+233241234567");
    }
  });

  it("accepts a +233 prefixed phone", () => {
    const result = profileSchema.safeParse({
      name: "Ama Owusu",
      phone: "+233551234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toMatch(/^\+233/);
    }
  });

  it("treats a blank phone as null (clears it)", () => {
    const result = profileSchema.safeParse({ name: "Ama Owusu", phone: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
    }
  });

  it("trims surrounding whitespace from the name", () => {
    const result = profileSchema.safeParse({
      name: "  Ama Owusu  ",
      phone: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ama Owusu");
    }
  });
});

describe("profileSchema — invalid inputs", () => {
  it("rejects an empty name", () => {
    const result = profileSchema.safeParse({ name: "", phone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 80 characters", () => {
    const result = profileSchema.safeParse({
      name: "a".repeat(81),
      phone: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-Ghana / invalid phone number", () => {
    const result = profileSchema.safeParse({
      name: "Ama Owusu",
      phone: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema — whitelist (security)", () => {
  it("never surfaces an injected role field in the parsed output", () => {
    const result = profileSchema.safeParse({
      name: "Ama Owusu",
      phone: "",
      role: "admin",
      email: "attacker@evil.test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("role");
      expect(result.data).not.toHaveProperty("email");
      expect(Object.keys(result.data).sort()).toEqual(["name", "phone"]);
    }
  });
});
